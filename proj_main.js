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
          	stands: new defs.Cube(),
          	skybox: new defs.Cube(),
        };
        // *** Materials
        this.materials = {
            sun: new Material(new defs.Phong_Shader(),
                {ambient: 1, color: hex_color("#ffffff")}),
          	floor: new Material(new Phong_Shader(), 
                {color: hex_color("#0000FF"), ambient: .1, diffusivity: 0.6, specularity: 0.4}),
            stands: new Material(new Phong_Shader(), 
              	{ambient: 1, color: hex_color("#ffffff")}),
          	skybox: new Material(new Phong_Shader(),
              	{ambient: 1, color: hex_color("#0000ff")}),
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 5, -20), vec3(0, 5, 0), vec3(0, 1, 0));
      	this.return_to_initial = false;
    }

    make_control_panel() {
        this.key_triggered_button("Return to the main scene", ["Control", "R"], () => {this.return_to_initial = true;});
        this.new_line();
    }

  	draw_lamps(context, program_state, model_transform) {
    		
    }
  
    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
      	//=============================================== camera section=============================================
        if (!context.scratchpad.controls) {
        	this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
      		// Define the global camera and projection matrices, which are stored in program_state.
        	program_state.set_camera(this.initial_camera_location);
        }
      	if (this.return_to_initial)
        {
          program_state.set_camera(this.initial_camera_location);
          this.return_to_initial = false;
          console.log(this.return_to_initial);
        }	// currently not working

      	const pi = Math.PI;
        let model_transform = Mat4.identity();
        program_state.projection_transform = Mat4.perspective(
            pi / 4, context.width / context.height, .1, 1000);
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
      
      	// The sun
        let sun_transform = model_transform
        												.times(Mat4.rotation(-(2./60.) * pi * t - pi / 2., 0, 0, 1))
        												.times(Mat4.translation(-20, 0, 20));
      	let sun_position = sun_transform.times(vec4(0, 0, 0, 1));
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(sun_position, color(1, 1, 1, 1), 10**5)];
        this.shapes.sun.draw(context, program_state, sun_transform, this.materials.sun.override({color: color(1,1,1,1)}));
      
      	// Skybox
      	let skybox_transform = Mat4.scale(40, 40, 40);
      	let skybox_color_light = color(0.4, 0.7, 1, 1);
      	let skybox_color_dark = color(0.2, 0.2, 0.4, 1);
      	let skybox_color_period = - 0.5 * Math.cos((2./60.) * pi * t) + 0.5
      	let skybox_color = (skybox_color_light.times(1 - skybox_color_period)).plus(skybox_color_dark.times(skybox_color_period));
      	this.shapes.skybox.draw(context, program_state, skybox_transform, this.materials.skybox.override({color: skybox_color}));
      
      	let floor_transform = Mat4.scale(50, 0.1, 50);
        this.shapes.floor.draw(context, program_state, floor_transform, this.materials.floor);

        let stands_base = Mat4.translation(0,0,0);
        let standscale = 2;
        let stands_board_transform = stands_base.times(Mat4.translation(0, 3.425*standscale, 0));
        stands_board_transform = stands_board_transform.times(Mat4.scale(1.8 * standscale, 1.05 * standscale, 0.1));
        let stands_support_transform = stands_base.times(Mat4.translation(0, 0.5 * 3.425 * standscale, 0));
        stands_support_transform = stands_support_transform.times(Mat4.scale(0.2 * standscale, 0.5 * 3.425 * standscale, 0.1));
        let stands_foundation = stands_base.times(Mat4.translation(0, 0.15*standscale, 0));
        stands_foundation = stands_foundation.times(Mat4.scale(standscale, 0.155* standscale, standscale));
        this.shapes.stands.draw(context, program_state, stands_board_transform, this.materials.stands);
        this.shapes.stands.draw(context, program_state, stands_support_transform, this.materials.stands);
        this.shapes.stands.draw(context, program_state, stands_foundation, this.materials.stands);

        
    }
}