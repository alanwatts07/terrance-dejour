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
