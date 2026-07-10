"""add is_onboarded to users

Revision ID: e4d5c6b7a8f9
Revises: c9f2a41d7e35
Create Date: 2026-07-10 15:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e4d5c6b7a8f9'
down_revision: Union[str, None] = 'c9f2a41d7e35'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # usuários existentes (manuais e seed) já contam como finalizados
    op.add_column(
        'users',
        sa.Column(
            'is_onboarded',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('true'),
        ),
    )


def downgrade() -> None:
    op.drop_column('users', 'is_onboarded')
