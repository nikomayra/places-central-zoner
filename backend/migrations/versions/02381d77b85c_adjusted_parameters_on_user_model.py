"""Adjusted parameters on User model

Revision ID: 02381d77b85c
Revises: ca856618ebdc
Create Date: 2024-08-17 17:41:13.726536

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '02381d77b85c'
down_revision = 'ca856618ebdc'
branch_labels = None
depends_on = None


# Manually create the upgrade and downgrade functions
def upgrade():
    op.alter_column('user', 'searched_places',
                    existing_type=sa.JSON(),
                    nullable=False,
                    server_default=sa.text("'{}'"))
    op.alter_column('user', 'clusters',
                    existing_type=sa.JSON(),
                    nullable=False,
                    server_default=sa.text("'{}'"))

def downgrade():
    op.alter_column('user', 'searched_places',
                    existing_type=sa.JSON(),
                    nullable=True,
                    server_default=None)
    op.alter_column('user', 'clusters',
                    existing_type=sa.JSON(),
                    nullable=True,
                    server_default=None)
