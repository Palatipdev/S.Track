"""add po_number to purchase orders

Revision ID: 481c2a16e72d
Revises: da22d5d6d67c
Create Date: 2026-07-06 13:43:47.134572

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '481c2a16e72d'
down_revision: Union[str, Sequence[str], None] = 'da22d5d6d67c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('purchase_orders', sa.Column('po_number', sa.Text(), nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('purchase_orders', 'po_number')
