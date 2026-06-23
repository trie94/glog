import { Post } from "../post.ts";
import QuadrupedRobot from "./quadruped-robot.ts";

export class QuadrupedRobotPost extends Post {
    // override the base method to instantiate our interactive canvas wrapper
    protected override onPostRendered(): void {
        const visualizerAnchor = this.contentEl.querySelector('#visualizer-container-1');
        if (visualizerAnchor instanceof HTMLElement) {
            new QuadrupedRobot(visualizerAnchor);
        }
    }
}