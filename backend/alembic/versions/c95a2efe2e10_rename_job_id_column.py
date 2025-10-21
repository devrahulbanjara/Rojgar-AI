"""rename_job_id_column

Revision ID: c95a2efe2e10
Revises: bbc1b850ff7a
Create Date: 2025-10-21 12:47:23.856687

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c95a2efe2e10'
down_revision: Union[str, Sequence[str], None] = 'bbc1b850ff7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # SQLite doesn't support ALTER COLUMN for renaming, so we need to recreate the table
    # First, create a new table with the correct schema
    op.create_table('job_new',
        sa.Column('job_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('department', sa.String(), nullable=False),
        sa.Column('level', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('location_type', sa.String(), nullable=False),
        sa.Column('is_remote', sa.Boolean(), nullable=False),
        sa.Column('employment_type', sa.String(), nullable=False),
        sa.Column('salary_min', sa.Integer(), nullable=False),
        sa.Column('salary_max', sa.Integer(), nullable=False),
        sa.Column('salary_currency', sa.String(), nullable=False),
        sa.Column('requirements', sa.JSON(), nullable=False),
        sa.Column('skills', sa.JSON(), nullable=False),
        sa.Column('benefits', sa.JSON(), nullable=False),
        sa.Column('posted_date', sa.Date(), nullable=False),
        sa.Column('application_deadline', sa.Date(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('is_featured', sa.Boolean(), nullable=False),
        sa.Column('applicant_count', sa.Integer(), nullable=False),
        sa.Column('views_count', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('job_id')
    )
    
    # Copy data from old table to new table
    op.execute('''
        INSERT INTO job_new (job_id, title, department, level, description, location, 
                           location_type, is_remote, employment_type, salary_min, 
                           salary_max, salary_currency, requirements, skills, benefits, 
                           posted_date, application_deadline, status, is_featured, 
                           applicant_count, views_count, company_id, created_by, 
                           created_at, updated_at)
        SELECT id, title, department, level, description, location, 
               location_type, is_remote, employment_type, salary_min, 
               salary_max, salary_currency, requirements, skills, benefits, 
               posted_date, application_deadline, status, is_featured, 
               applicant_count, views_count, company_id, created_by, 
               created_at, updated_at
        FROM job
    ''')
    
    # Drop the old table
    op.drop_table('job')
    
    # Rename the new table to the original name
    op.rename_table('job_new', 'job')


def downgrade() -> None:
    """Downgrade schema."""
    # Create a new table with the old schema
    op.create_table('job_old',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('department', sa.String(), nullable=False),
        sa.Column('level', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('location_type', sa.String(), nullable=False),
        sa.Column('is_remote', sa.Boolean(), nullable=False),
        sa.Column('employment_type', sa.String(), nullable=False),
        sa.Column('salary_min', sa.Integer(), nullable=False),
        sa.Column('salary_max', sa.Integer(), nullable=False),
        sa.Column('salary_currency', sa.String(), nullable=False),
        sa.Column('requirements', sa.JSON(), nullable=False),
        sa.Column('skills', sa.JSON(), nullable=False),
        sa.Column('benefits', sa.JSON(), nullable=False),
        sa.Column('posted_date', sa.Date(), nullable=False),
        sa.Column('application_deadline', sa.Date(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('is_featured', sa.Boolean(), nullable=False),
        sa.Column('applicant_count', sa.Integer(), nullable=False),
        sa.Column('views_count', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Copy data from new table to old table
    op.execute('''
        INSERT INTO job_old (id, title, department, level, description, location, 
                           location_type, is_remote, employment_type, salary_min, 
                           salary_max, salary_currency, requirements, skills, benefits, 
                           posted_date, application_deadline, status, is_featured, 
                           applicant_count, views_count, company_id, created_by, 
                           created_at, updated_at)
        SELECT job_id, title, department, level, description, location, 
               location_type, is_remote, employment_type, salary_min, 
               salary_max, salary_currency, requirements, skills, benefits, 
               posted_date, application_deadline, status, is_featured, 
               applicant_count, views_count, company_id, created_by, 
               created_at, updated_at
        FROM job
    ''')
    
    # Drop the new table
    op.drop_table('job')
    
    # Rename the old table back to the original name
    op.rename_table('job_old', 'job')
