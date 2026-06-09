import { Post } from "./post.ts";
import { RobotArmPost } from "./robot-arm-post.ts";

export function createPostInstance(postId: string, contentEl: HTMLElement): Post {
    if (postId === 'robot-arm-target') {
        return new RobotArmPost(contentEl);
    }
    return new Post(contentEl);
}