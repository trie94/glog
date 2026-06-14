import { Post } from "./post.ts";
// import Visualizer from "./visualizer.ts";
import CcdSolver from "./ccd-solver.ts";
import FabrikSolver from "./fabrik-solver.ts";

export class RobotArmPost extends Post {
    // override the base method to instantiate our interactive canvas wrapper
    protected override onPostRendered(): void {
        const visualizerAnchor = this.contentEl.querySelector('#visualizer-container-1');
        if (visualizerAnchor instanceof HTMLElement) {
            new CcdSolver(visualizerAnchor);
        }

        const visualizerAnchor2 = this.contentEl.querySelector('#visualizer-container-2');
        if (visualizerAnchor2 instanceof HTMLElement) {
            new CcdSolver(visualizerAnchor2);
        }

        const visualizerAnchor3 = this.contentEl.querySelector('#visualizer-container-3');
        if (visualizerAnchor3 instanceof HTMLElement) {
            new FabrikSolver(visualizerAnchor3);
        }
    }
}