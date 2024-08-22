"""changed dict to list for user model

Revision ID: 09a5f81b7239
Revises: f6513da6dc5f
Create Date: 2024-08-17 23:03:36.878356

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '09a5f81b7239'
down_revision = 'f6513da6dc5f'
branch_labels = None
depends_on = None


def upgrade():
    # Drop the columns first (this removes the existing data)
    with op.batch_alter_table('user') as batch_op:
        batch_op.drop_column('searched_places')
        batch_op.drop_column('clusters')

    # Add the columns back with the correct data type and default
    with op.batch_alter_table('user') as batch_op:
        batch_op.add_column(sa.Column('searched_places', sa.JSON, nullable=False, server_default='[]'))
        batch_op.add_column(sa.Column('clusters', sa.JSON, nullable=False, server_default='[]'))


def downgrade():
    # Reverse the changes made in upgrade

    # Drop the updated columns
    with op.batch_alter_table('user') as batch_op:
        batch_op.drop_column('searched_places')
        batch_op.drop_column('clusters')

    # Add the columns back with the original data type (dict) and default (dict)
    with op.batch_alter_table('user') as batch_op:
        batch_op.add_column(sa.Column('searched_places', sa.JSON, nullable=False, server_default='{}'))
        batch_op.add_column(sa.Column('clusters', sa.JSON, nullable=False, server_default='{}'))
