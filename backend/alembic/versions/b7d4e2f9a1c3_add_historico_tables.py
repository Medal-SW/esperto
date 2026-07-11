"""add historico tables

Revision ID: b7d4e2f9a1c3
Revises: eca2c4ce5d43
Create Date: 2026-07-11 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b7d4e2f9a1c3'
down_revision: Union[str, None] = 'eca2c4ce5d43'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('historico_events',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('name', sa.String(length=120), nullable=False),
    sa.Column('year', sa.Integer(), nullable=False),
    sa.Column('category', sa.String(length=20), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_historico_events_name'), 'historico_events', ['name'], unique=True)
    op.create_index(op.f('ix_historico_events_year'), 'historico_events', ['year'], unique=False)
    op.create_table('historico_sessions',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('played_date', sa.Date(), nullable=False),
    sa.Column('target_event_id', sa.Integer(), nullable=False),
    sa.Column('guesses', postgresql.JSON(astext_type=sa.Text()), server_default='[]', nullable=False),
    sa.Column('solved', sa.Boolean(), server_default='false', nullable=False),
    sa.Column('attempts', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['target_event_id'], ['historico_events.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'played_date', name='uq_user_historico_date')
    )
    op.create_index(op.f('ix_historico_sessions_played_date'), 'historico_sessions', ['played_date'], unique=False)
    op.create_index(op.f('ix_historico_sessions_user_id'), 'historico_sessions', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_historico_sessions_user_id'), table_name='historico_sessions')
    op.drop_index(op.f('ix_historico_sessions_played_date'), table_name='historico_sessions')
    op.drop_table('historico_sessions')
    op.drop_index(op.f('ix_historico_events_year'), table_name='historico_events')
    op.drop_index(op.f('ix_historico_events_name'), table_name='historico_events')
    op.drop_table('historico_events')
