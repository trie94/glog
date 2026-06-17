import { Post } from "./post.ts";
import { RobotArmPost } from "./robot-arm-post.ts";
import {CcdSolverPost} from "./ccd-solver-post.ts";
import {FabrikSolverPost} from "./fabrik-solver-post.ts";

export function createPostInstance(postId: string, contentEl: HTMLElement): Post {
    if (postId === 'robot-arm-target') {
        return new RobotArmPost(contentEl);
    }
    if (postId === 'ccd-solver') {
        return new CcdSolverPost(contentEl);
    }
    if (postId === 'fabrik-solver') {
        return new FabrikSolverPost(contentEl);
    }
    return new Post(contentEl);
}