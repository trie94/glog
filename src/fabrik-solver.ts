import Visualizer from "./visualizer.ts";

export default class FabrikSolver extends Visualizer {

    start() {
        super.start();
        this.renderer.render(this.scene, this.camera);
    }

    update() {

    }
}