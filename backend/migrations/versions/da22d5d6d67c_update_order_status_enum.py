"""update order status enum

Revision ID: da22d5d6d67c
Revises: f9b110a57f38
Create Date: 2026-07-05 11:41:24.254995

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'da22d5d6d67c'
down_revision: Union[str, Sequence[str], None] = 'f9b110a57f38'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE order_status RENAME TO order_status_old")
    op.execute("CREATE TYPE order_status AS ENUM ('open', 'partially_received', 'received', 'closed', 'cancelled')")
    op.execute("""
        ALTER TABLE purchase_orders
        ALTER COLUMN status DROP DEFAULT,
        ALTER COLUMN status TYPE order_status USING (
            CASE status::text
                WHEN 'pending' THEN 'open'
                WHEN 'delivered' THEN 'received'
                WHEN 'cancelled' THEN 'cancelled'
            END
        )::order_status,
        ALTER COLUMN status SET DEFAULT 'open'::order_status
    """)
    op.execute("DROP TYPE order_status_old")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TYPE order_status RENAME TO order_status_new")
    op.execute("CREATE TYPE order_status AS ENUM ('pending', 'delivered', 'cancelled')")
    op.execute("""
        ALTER TABLE purchase_orders
        ALTER COLUMN status DROP DEFAULT,
        ALTER COLUMN status TYPE order_status USING (
            CASE status::text
                WHEN 'open' THEN 'pending'
                WHEN 'partially_received' THEN 'pending'
                WHEN 'received' THEN 'delivered'
                WHEN 'closed' THEN 'delivered'
                WHEN 'cancelled' THEN 'cancelled'
            END
        )::order_status,
        ALTER COLUMN status SET DEFAULT 'pending'::order_status
    """)
    op.execute("DROP TYPE order_status_new")
