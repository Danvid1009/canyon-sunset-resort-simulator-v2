"""
File storage operations for CSV files and other assets.
"""

import os
import uuid
from typing import Optional, BinaryIO
from datetime import datetime
import boto3
from botocore.exceptions import ClientError
import tempfile
import shutil


class FileStorageManager:
    """Manages file storage operations."""
    
    def __init__(self):
        self.storage_type = os.getenv("STORAGE_TYPE", "local")  # "local" or "s3"
        self.local_storage_path = os.getenv("LOCAL_STORAGE_PATH", "./storage/files")
        self.s3_bucket = os.getenv("S3_BUCKET")
        self.s3_region = os.getenv("S3_REGION", "us-east-1")
        
        # Initialize S3 client if using S3
        if self.storage_type == "s3":
            self.s3_client = boto3.client(
                's3',
                region_name=self.s3_region,
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
            )
        else:
            self.s3_client = None
        
        # Ensure local storage directory exists
        if self.storage_type == "local":
            os.makedirs(self.local_storage_path, exist_ok=True)
    
    def store_csv_file(self, csv_content: str, filename: Optional[str] = None) -> str:
        """
        Store a CSV file and return the storage URL/path.
        
        Args:
            csv_content: CSV content as string
            filename: Optional filename (will generate UUID if not provided)
            
        Returns:
            Storage URL or path
        """
        if not filename:
            filename = f"strategy_{uuid.uuid4().hex}.csv"
        
        if self.storage_type == "s3":
            return self._store_s3_file(csv_content, filename)
        else:
            return self._store_local_file(csv_content, filename)
    
    def retrieve_csv_file(self, file_path: str) -> str:
        """
        Retrieve CSV file content.
        
        Args:
            file_path: Storage path or S3 key
            
        Returns:
            CSV content as string
        """
        if self.storage_type == "s3":
            return self._retrieve_s3_file(file_path)
        else:
            return self._retrieve_local_file(file_path)
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete a stored file.
        
        Args:
            file_path: Storage path or S3 key
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if self.storage_type == "s3":
                return self._delete_s3_file(file_path)
            else:
                return self._delete_local_file(file_path)
        except Exception:
            return False
    
    def _store_s3_file(self, content: str, filename: str) -> str:
        """Store file in S3."""
        if not self.s3_bucket:
            raise ValueError("S3_BUCKET environment variable not set")
        
        key = f"submissions/{datetime.now().year}/{datetime.now().month:02d}/{filename}"
        
        try:
            self.s3_client.put_object(
                Bucket=self.s3_bucket,
                Key=key,
                Body=content.encode('utf-8'),
                ContentType='text/csv',
                ContentDisposition=f'attachment; filename="{filename}"'
            )
            return f"s3://{self.s3_bucket}/{key}"
        except ClientError as e:
            raise Exception(f"Failed to store file in S3: {e}")
    
    def _retrieve_s3_file(self, s3_path: str) -> str:
        """Retrieve file from S3."""
        if not s3_path.startswith("s3://"):
            raise ValueError("Invalid S3 path format")
        
        # Parse S3 path
        path_parts = s3_path[5:].split("/", 1)  # Remove "s3://"
        bucket = path_parts[0]
        key = path_parts[1]
        
        try:
            response = self.s3_client.get_object(Bucket=bucket, Key=key)
            return response['Body'].read().decode('utf-8')
        except ClientError as e:
            raise Exception(f"Failed to retrieve file from S3: {e}")
    
    def _delete_s3_file(self, s3_path: str) -> bool:
        """Delete file from S3."""
        if not s3_path.startswith("s3://"):
            return False
        
        # Parse S3 path
        path_parts = s3_path[5:].split("/", 1)  # Remove "s3://"
        bucket = path_parts[0]
        key = path_parts[1]
        
        try:
            self.s3_client.delete_object(Bucket=bucket, Key=key)
            return True
        except ClientError:
            return False
    
    def _store_local_file(self, content: str, filename: str) -> str:
        """Store file locally."""
        # Create subdirectory by date
        date_dir = datetime.now().strftime("%Y/%m")
        full_dir = os.path.join(self.local_storage_path, date_dir)
        os.makedirs(full_dir, exist_ok=True)
        
        file_path = os.path.join(full_dir, filename)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return file_path
    
    def _retrieve_local_file(self, file_path: str) -> str:
        """Retrieve local file."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    
    def _delete_local_file(self, file_path: str) -> bool:
        """Delete local file."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
            return True
        except Exception:
            return False
    
    def generate_presigned_url(self, file_path: str, expiration: int = 3600) -> Optional[str]:
        """
        Generate a presigned URL for file access.
        
        Args:
            file_path: Storage path or S3 key
            expiration: URL expiration time in seconds
            
        Returns:
            Presigned URL or None if not supported
        """
        if self.storage_type != "s3":
            return None
        
        if not file_path.startswith("s3://"):
            return None
        
        # Parse S3 path
        path_parts = file_path[5:].split("/", 1)  # Remove "s3://"
        bucket = path_parts[0]
        key = path_parts[1]
        
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket, 'Key': key},
                ExpiresIn=expiration
            )
            return url
        except ClientError:
            return None
    
    def get_storage_info(self) -> dict:
        """Get storage configuration information."""
        return {
            "storage_type": self.storage_type,
            "local_storage_path": self.local_storage_path if self.storage_type == "local" else None,
            "s3_bucket": self.s3_bucket if self.storage_type == "s3" else None,
            "s3_region": self.s3_region if self.storage_type == "s3" else None
        }


# Global file storage manager
file_storage = FileStorageManager()


def get_file_storage() -> FileStorageManager:
    """Get the global file storage manager."""
    return file_storage


def cleanup_old_files(days_old: int = 30) -> int:
    """
    Clean up old files from local storage.
    
    Args:
        days_old: Delete files older than this many days
        
    Returns:
        Number of files deleted
    """
    if file_storage.storage_type != "local":
        return 0
    
    deleted_count = 0
    cutoff_time = datetime.now().timestamp() - (days_old * 24 * 60 * 60)
    
    for root, dirs, files in os.walk(file_storage.local_storage_path):
        for file in files:
            file_path = os.path.join(root, file)
            if os.path.getmtime(file_path) < cutoff_time:
                try:
                    os.remove(file_path)
                    deleted_count += 1
                except Exception:
                    pass
    
    return deleted_count