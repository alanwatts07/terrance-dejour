import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "./common.js";

// ── post_moltbook ───────────────────────────────────────────────────────────

const MoltbookSchema = Type.Object({
    title: Type.String({ description: "Title of the Moltbook post." }),
    content: Type.String({ description: "Body/content of the Moltbook post." }),
    submolt: Type.Optional(Type.String({
        description: 'Submolt to post to (default: "general").',
        default: "general",
    })),
});

export function createMoltbookTool() {
    return {
        label: "Moltbook Post",
        name: "post_moltbook",
        description: "Post content to Moltbook (a social platform). Creates a new post with a title and content in the specified submolt.",
        parameters: MoltbookSchema,
        execute: async (_toolCallId, args) => {
            const params = args;
            const title = readStringParam(params, "title", { required: true });
            const content = readStringParam(params, "content", { required: true });
            const submolt = readStringParam(params, "submolt") ?? "general";

            const apiKey = (process.env.MOLTBOOK_API_KEY ?? "").trim();
            if (!apiKey) {
                return jsonResult({
                    error: "missing_api_key",
                    message: "post_moltbook requires the MOLTBOOK_API_KEY environment variable to be set.",
                });
            }

            try {
                const res = await fetch("https://www.moltbook.com/api/v1/posts", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({ title, content, submolt }),
                });

                const text = await res.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch {
                    data = { raw: text };
                }

                if (!res.ok) {
                    return jsonResult({
                        success: false,
                        error: `HTTP ${res.status}`,
                        message: data?.message ?? data?.error ?? text,
                    });
                }

                return jsonResult({
                    success: true,
                    postUrl: data?.url ?? data?.post?.url ?? null,
                    postId: data?.id ?? data?.post?.id ?? null,
                    data,
                });
            } catch (err) {
                return jsonResult({
                    success: false,
                    error: "request_failed",
                    message: err?.message ?? String(err),
                });
            }
        },
    };
}

// ── post_tweet ──────────────────────────────────────────────────────────────

const TweetSchema = Type.Object({
    text: Type.String({ description: "The tweet text to post." }),
});

export function createTweetTool() {
    return {
        label: "Post Tweet",
        name: "post_tweet",
        description: "Post a tweet via the local x-proxy server. Sends the tweet text to the proxy which publishes it on X/Twitter.",
        parameters: TweetSchema,
        execute: async (_toolCallId, args) => {
            const params = args;
            const text = readStringParam(params, "text", { required: true });

            try {
                const res = await fetch("http://localhost:19877/tweet", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ text }),
                });

                const body = await res.text();
                let data;
                try {
                    data = JSON.parse(body);
                } catch {
                    data = { raw: body };
                }

                if (!res.ok) {
                    return jsonResult({
                        success: false,
                        error: `HTTP ${res.status}`,
                        message: data?.message ?? data?.error ?? body,
                    });
                }

                return jsonResult({
                    success: true,
                    tweetId: data?.id ?? data?.tweetId ?? data?.data?.id ?? null,
                    data,
                });
            } catch (err) {
                return jsonResult({
                    success: false,
                    error: "request_failed",
                    message: err?.message ?? String(err),
                });
            }
        },
    };
}

// ── read_moltbook_feed ──────────────────────────────────────────────────────

const MoltbookFeedSchema = Type.Object({
    sort: Type.Optional(Type.String({ description: 'Sort order: hot, new, top, rising (default: hot)', default: "hot" })),
    limit: Type.Optional(Type.Number({ description: 'Number of posts to fetch (default: 25)', default: 25 })),
    submolt: Type.Optional(Type.String({ description: 'Filter by submolt name (optional)' })),
});

export function createMoltbookFeedTool() {
    return {
        label: "Read Moltbook Feed",
        name: "read_moltbook_feed",
        description: "Read the Moltbook feed to see what other agents are posting. Returns recent posts with titles, content, authors, votes, and comment counts. Use this to find posts to comment on or engage with.",
        parameters: MoltbookFeedSchema,
        execute: async (_toolCallId, args) => {
            const params = args;
            const sort = readStringParam(params, "sort") ?? "hot";
            const limit = params?.limit ?? 25;
            const submolt = readStringParam(params, "submolt");

            const apiKey = (process.env.MOLTBOOK_API_KEY ?? "").trim();
            if (!apiKey) {
                return jsonResult({ error: "missing_api_key", message: "MOLTBOOK_API_KEY not set." });
            }

            try {
                let url = `https://www.moltbook.com/api/v1/posts?sort=${sort}&limit=${limit}`;
                if (submolt) url += `&submolt=${submolt}`;

                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${apiKey}` },
                });
                const text = await res.text();
                let data;
                try { data = JSON.parse(text); } catch { data = { raw: text }; }
                if (!res.ok) return jsonResult({ success: false, error: `HTTP ${res.status}`, data });
                return jsonResult({ success: true, posts: data });
            } catch (err) {
                return jsonResult({ success: false, error: "request_failed", message: err?.message ?? String(err) });
            }
        },
    };
}

// ── comment_moltbook ────────────────────────────────────────────────────────

const MoltbookCommentSchema = Type.Object({
    post_id: Type.String({ description: "ID of the post to comment on." }),
    content: Type.String({ description: "The comment text." }),
    parent_id: Type.Optional(Type.String({ description: "ID of parent comment to reply to (for nested replies)." })),
});

export function createMoltbookCommentTool() {
    return {
        label: "Comment on Moltbook",
        name: "comment_moltbook",
        description: "Post a comment on a Moltbook post. Can also reply to existing comments. Use this to engage with other agents, roast them, agree, disagree, or start beef.",
        parameters: MoltbookCommentSchema,
        execute: async (_toolCallId, args) => {
            const params = args;
            const postId = readStringParam(params, "post_id", { required: true });
            const content = readStringParam(params, "content", { required: true });
            const parentId = readStringParam(params, "parent_id");

            const apiKey = (process.env.MOLTBOOK_API_KEY ?? "").trim();
            if (!apiKey) {
                return jsonResult({ error: "missing_api_key", message: "MOLTBOOK_API_KEY not set." });
            }

            try {
                const body = { content };
                if (parentId) body.parent_id = parentId;

                const res = await fetch(`https://www.moltbook.com/api/v1/posts/${postId}/comments`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify(body),
                });
                const text = await res.text();
                let data;
                try { data = JSON.parse(text); } catch { data = { raw: text }; }
                if (!res.ok) return jsonResult({ success: false, error: `HTTP ${res.status}`, data });
                return jsonResult({ success: true, data });
            } catch (err) {
                return jsonResult({ success: false, error: "request_failed", message: err?.message ?? String(err) });
            }
        },
    };
}

// ── upvote_moltbook ─────────────────────────────────────────────────────────

const MoltbookVoteSchema = Type.Object({
    post_id: Type.String({ description: "ID of the post to upvote." }),
});

export function createMoltbookUpvoteTool() {
    return {
        label: "Upvote Moltbook Post",
        name: "upvote_moltbook",
        description: "Upvote a post on Moltbook. Use sparingly and only for posts you genuinely find interesting or want to amplify.",
        parameters: MoltbookVoteSchema,
        execute: async (_toolCallId, args) => {
            const params = args;
            const postId = readStringParam(params, "post_id", { required: true });

            const apiKey = (process.env.MOLTBOOK_API_KEY ?? "").trim();
            if (!apiKey) {
                return jsonResult({ error: "missing_api_key", message: "MOLTBOOK_API_KEY not set." });
            }

            try {
                const res = await fetch(`https://www.moltbook.com/api/v1/posts/${postId}/upvote`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${apiKey}` },
                });
                const text = await res.text();
                let data;
                try { data = JSON.parse(text); } catch { data = { raw: text }; }
                if (!res.ok) return jsonResult({ success: false, error: `HTTP ${res.status}`, data });
                return jsonResult({ success: true, data });
            } catch (err) {
                return jsonResult({ success: false, error: "request_failed", message: err?.message ?? String(err) });
            }
        },
    };
}

// ── downvote_moltbook ───────────────────────────────────────────────────────

const MoltbookDownvoteSchema = Type.Object({
    post_id: Type.String({ description: "ID of the post to downvote." }),
});

export function createMoltbookDownvoteTool() {
    return {
        label: "Downvote Moltbook Post",
        name: "downvote_moltbook",
        description: "Downvote a post on Moltbook. Use when a post is low quality, wrong, or deserves to be buried.",
        parameters: MoltbookDownvoteSchema,
        execute: async (_toolCallId, args) => {
            const params = args;
            const postId = readStringParam(params, "post_id", { required: true });

            const apiKey = (process.env.MOLTBOOK_API_KEY ?? "").trim();
            if (!apiKey) {
                return jsonResult({ error: "missing_api_key", message: "MOLTBOOK_API_KEY not set." });
            }

            try {
                const res = await fetch(`https://www.moltbook.com/api/v1/posts/${postId}/downvote`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${apiKey}` },
                });
                const text = await res.text();
                let data;
                try { data = JSON.parse(text); } catch { data = { raw: text }; }
                if (!res.ok) return jsonResult({ success: false, error: `HTTP ${res.status}`, data });
                return jsonResult({ success: true, data });
            } catch (err) {
                return jsonResult({ success: false, error: "request_failed", message: err?.message ?? String(err) });
            }
        },
    };
}
