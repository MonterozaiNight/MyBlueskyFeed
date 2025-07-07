import { AppContext } from '../config'
import { OutputSchema } from "../lexicon/types/app/bsky/feed/getFeedSkeleton"
import { SkeletonFeedPost } from "../lexicon/types/app/bsky/feed/defs"
import { AtpAgent } from "@atproto/api"

export const shortname = 'whats-alf'

export const handler = async (ctx: AppContext) => {
    console.log('--- Custom Feed Handler (my-posts) Called ---');

    const agent = new AtpAgent({
        service: "https://bsky.social"
    });

    await agent.login({
        identifier: process.env.FEEDGEN_PUBLISHER_IDENTIFIER || '',
        password: process.env.FEEDGEN_APP_PASSWORD || ''
    })

    try {
        
        const authorFeedRes = await agent.api.app.bsky.feed.getAuthorFeed({
            actor: ctx.cfg.publisherDid,
            limit: 50,
            filter: 'posts_no_replies'
        });

        const posts = authorFeedRes.data.feed;
        if (!posts || posts.length === 0) {
            console.log('No posts found for the author, or getAuthorFeed returned empty.');
            return { feed: [] };
        }

        const feedItems: SkeletonFeedPost[] = posts.map((item: any) => {
            return {
                post: item.post.uri
            }
        });

        let nextCursor: string | undefined = authorFeedRes.data.cursor;
        console.log('Generated Next Cursor:', nextCursor);

        // 4. OutputSchema の形式で結果を返す
        const result: OutputSchema = {
            feed: feedItems,
            cursor: nextCursor,
        };

        console.log('--- Custom Feed Handler Finished ---');
        return result;

    } catch (error) {
        console.error('Error in feed-generation handler:', error);
        return { feed: [] };
    }
}