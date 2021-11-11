import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;
const {Cube, Axis_Arrows, Textured_Phong, Phong_Shader, Basic_Shader, Subdivision_Sphere} = defs

export class Proj_main_scene extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            basketball: new defs.Subdivision_Sphere(8),
            circle: new defs.Regular_2D_Polygon(1, 15),
          	floor: new defs.Cube(),
            sun: new defs.Subdivision_Sphere(4),
        };
        // *** Materials
        this.materials = {
            sun: new Material(new defs.Phong_Shader(),
                {ambient: 1, color: hex_color("#ffffff")}),
          	floor: new Material(new Phong_Shader(), 
                {color: hex_color("#0000FF"), ambient: .3, diffusivity: 0.6, specularity: 0.4, smoothness: 64})
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    make_control_panel() {
        this.key_triggered_button("Return to the main scene", ["Control", "R"], () => this.attached = () => this.resetCamera);
        this.new_line();
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }
        this.resetCamera = this.initial_camera_location;
      	if(this.attached != undefined)
        {
            let desired = this.attached();
            desired = desired.map((x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, 0.1));
            program_state.set_camera(desired);
        }

      	const pi = Math.PI;
        let model_transform = Mat4.identity();
        program_state.projection_transform = Mat4.perspective(
            pi / 4, context.width / context.height, .1, 1000);
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        let sun_transform = Mat4.rotation((2./60.) * pi * t, 0, 0, 1)
        												.times(Mat4.translation(10, 0, 0))
        												.times(model_transform);
      	let sun_position = sun_transform.times(vec4(0, 0, 0, 1));
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(sun_position, color(1, 1, 1, 1), 10**5)];
        this.shapes.sun.draw(context, program_state, sun_transform, this.materials.sun.override({color: color(1,1,1,1)}));
      
      
      	let floor_transform = Mat4.scale(8, 0.1, 5);
        this.shapes.floor.draw(context, program_state, floor_transform, this.materials.floor);

        
    }
}