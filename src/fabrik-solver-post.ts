import { Post } from "./post.ts";
import FabrikSolver from "./fabrik-solver.ts";

export class FabrikSolverPost extends Post {
    // override the base method to instantiate our interactive canvas wrapper
    protected override onPostRendered(): void {
        const visualizerAnchor = this.contentEl.querySelector('#visualizer-container-1');
        if (visualizerAnchor instanceof HTMLElement) {
            new FabrikSolver(visualizerAnchor);
        }
    }
}