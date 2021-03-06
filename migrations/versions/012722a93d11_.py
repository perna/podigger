"""empty message

Revision ID: 012722a93d11
Revises: 8097d3d0862a
Create Date: 2016-07-04 21:46:57.398105

"""

# revision identifiers, used by Alembic.
revision = '012722a93d11'
down_revision = '8097d3d0862a'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('topic_suggestion',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('is_recorded', sa.Boolean(), nullable=False),
    sa.Column('podcast_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['podcast_id'], ['podcast.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_topic_suggestion_id'), 'topic_suggestion', ['id'], unique=False)
    op.create_index(op.f('ix_topic_suggestion_title'), 'topic_suggestion', ['title'], unique=False)
    op.create_index(op.f('ix_episode_id'), 'episode', ['id'], unique=False)
    op.create_index(op.f('ix_podcast_id'), 'podcast', ['id'], unique=False)
    op.create_index(op.f('ix_popular_term_id'), 'popular_term', ['id'], unique=False)
    op.create_index(op.f('ix_tag_id'), 'tag', ['id'], unique=False)
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_tag_id'), table_name='tag')
    op.drop_index(op.f('ix_popular_term_id'), table_name='popular_term')
    op.drop_index(op.f('ix_podcast_id'), table_name='podcast')
    op.drop_index(op.f('ix_episode_id'), table_name='episode')
    op.drop_index(op.f('ix_topic_suggestion_title'), table_name='topic_suggestion')
    op.drop_index(op.f('ix_topic_suggestion_id'), table_name='topic_suggestion')
    op.drop_table('topic_suggestion')
    ### end Alembic commands ###
