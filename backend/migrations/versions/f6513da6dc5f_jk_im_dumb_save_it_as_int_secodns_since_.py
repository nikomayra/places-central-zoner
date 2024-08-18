"""jk im dumb, save it as int...secodns since epoch UTC

Revision ID: f6513da6dc5f
Revises: c0d90773ef05
Create Date: 2024-08-17 18:05:53.137579

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f6513da6dc5f'
down_revision = 'c0d90773ef05'
branch_labels = None
depends_on = None


def upgrade():
    # Drop the existing expiration column
    op.drop_column('session', 'expiration')
    
    # Add the new expiration column with INTEGER type and NOT NULL constraint
    op.add_column('session', sa.Column('expiration', sa.Integer(), nullable=False))

def downgrade():
    # Downgrade step: Drop the INTEGER expiration column
    op.drop_column('session', 'expiration')
    
    # Add the old expiration column back with DateTime type
    op.add_column('session', sa.Column('expiration', sa.DateTime(), nullable=False))
