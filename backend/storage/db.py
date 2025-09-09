"""
Database models and operations for the Canyon Sunset Resort simulation.
"""

import os
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import UUID
import uuid
import json

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./canyon_sunset.db")

# Create engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Student(Base):
    """Student information."""
    __tablename__ = "students"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    section = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AssignmentVersion(Base):
    """Assignment version configuration."""
    __tablename__ = "assignment_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    label = Column(String(100), nullable=False, unique=True)
    rng_seed = Column(Integer, nullable=False)
    I = Column(Integer, nullable=False)  # Capacity levels
    T = Column(Integer, nullable=False)  # Time periods
    due_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Submission(Base):
    """Student submission."""
    __tablename__ = "submissions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    assignment_version_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Configuration
    I = Column(Integer, nullable=False)
    T = Column(Integer, nullable=False)
    trials = Column(Integer, nullable=False)
    seed = Column(Integer, nullable=False)
    
    # Strategy data
    philosophy = Column(Text, nullable=False)
    csv_url = Column(String(500), nullable=True)  # URL to stored CSV file
    policy_json = Column(JSON, nullable=False)  # Normalized policy matrix
    
    # Results
    aggregates_json = Column(JSON, nullable=False)  # Simulation aggregates
    sample_trial_json = Column(JSON, nullable=True)  # Sample trial data
    
    # Metadata
    processing_time_ms = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)


class DatabaseManager:
    """Database operations manager."""
    
    def __init__(self):
        self.engine = engine
        self.SessionLocal = SessionLocal
    
    def create_tables(self):
        """Create all database tables."""
        Base.metadata.create_all(bind=self.engine)
    
    def get_session(self) -> Session:
        """Get database session."""
        return self.SessionLocal()
    
    def get_or_create_student(self, email: str, name: str, section: Optional[str] = None) -> Student:
        """Get or create a student record."""
        session = self.get_session()
        try:
            student = session.query(Student).filter(Student.email == email).first()
            if not student:
                student = Student(email=email, name=name, section=section)
                session.add(student)
                session.commit()
                session.refresh(student)
            return student
        finally:
            session.close()
    
    def get_or_create_assignment_version(
        self, 
        label: str, 
        rng_seed: int, 
        I: int, 
        T: int, 
        due_at: Optional[datetime] = None
    ) -> AssignmentVersion:
        """Get or create an assignment version."""
        session = self.get_session()
        try:
            version = session.query(AssignmentVersion).filter(AssignmentVersion.label == label).first()
            if not version:
                version = AssignmentVersion(
                    label=label,
                    rng_seed=rng_seed,
                    I=I,
                    T=T,
                    due_at=due_at
                )
                session.add(version)
                session.commit()
                session.refresh(version)
            return version
        finally:
            session.close()
    
    def create_submission(
        self,
        student_id: uuid.UUID,
        assignment_version_id: uuid.UUID,
        I: int,
        T: int,
        trials: int,
        seed: int,
        philosophy: str,
        csv_url: Optional[str],
        policy_json: Dict[str, Any],
        aggregates_json: Dict[str, Any],
        sample_trial_json: Optional[Dict[str, Any]] = None,
        processing_time_ms: Optional[int] = None,
        error_message: Optional[str] = None
    ) -> Submission:
        """Create a new submission record."""
        session = self.get_session()
        try:
            submission = Submission(
                student_id=student_id,
                assignment_version_id=assignment_version_id,
                I=I,
                T=T,
                trials=trials,
                seed=seed,
                philosophy=philosophy,
                csv_url=csv_url,
                policy_json=policy_json,
                aggregates_json=aggregates_json,
                sample_trial_json=sample_trial_json,
                processing_time_ms=processing_time_ms,
                error_message=error_message
            )
            session.add(submission)
            session.commit()
            session.refresh(submission)
            return submission
        finally:
            session.close()
    
    def get_submission(self, submission_id: uuid.UUID) -> Optional[Submission]:
        """Get a submission by ID."""
        session = self.get_session()
        try:
            return session.query(Submission).filter(Submission.id == submission_id).first()
        finally:
            session.close()
    
    def get_student_submissions(self, student_email: str) -> List[Submission]:
        """Get all submissions for a student."""
        session = self.get_session()
        try:
            return session.query(Submission).join(Student).filter(
                Student.email == student_email
            ).order_by(Submission.created_at.desc()).all()
        finally:
            session.close()
    
    def get_assignment_submissions(self, assignment_version_label: str) -> List[Submission]:
        """Get all submissions for an assignment version."""
        session = self.get_session()
        try:
            return session.query(Submission).join(AssignmentVersion).filter(
                AssignmentVersion.label == assignment_version_label
            ).order_by(Submission.created_at.desc()).all()
        finally:
            session.close()
    
    def get_submission_stats(self, assignment_version_label: str) -> Dict[str, Any]:
        """Get statistics for an assignment version."""
        session = self.get_session()
        try:
            submissions = session.query(Submission).join(AssignmentVersion).filter(
                AssignmentVersion.label == assignment_version_label
            ).all()
            
            if not submissions:
                return {
                    "total_submissions": 0,
                    "unique_students": 0,
                    "avg_revenue": 0,
                    "avg_fill_rate": 0,
                    "avg_price": 0
                }
            
            # Calculate statistics
            revenues = []
            fill_rates = []
            prices = []
            student_ids = set()
            
            for submission in submissions:
                aggregates = submission.aggregates_json
                revenues.append(aggregates.get("avg_revenue", 0))
                fill_rates.append(aggregates.get("fill_rate", 0))
                prices.append(aggregates.get("avg_price", 0))
                student_ids.add(submission.student_id)
            
            return {
                "total_submissions": len(submissions),
                "unique_students": len(student_ids),
                "avg_revenue": sum(revenues) / len(revenues) if revenues else 0,
                "avg_fill_rate": sum(fill_rates) / len(fill_rates) if fill_rates else 0,
                "avg_price": sum(prices) / len(prices) if prices else 0,
                "revenue_range": {
                    "min": min(revenues) if revenues else 0,
                    "max": max(revenues) if revenues else 0
                }
            }
        finally:
            session.close()


# Global database manager instance
db_manager = DatabaseManager()


def init_database():
    """Initialize the database."""
    db_manager.create_tables()
    print("Database initialized successfully")


def get_db_manager() -> DatabaseManager:
    """Get the global database manager."""
    return db_manager
