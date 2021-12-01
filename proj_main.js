/*
 * Todo
 * control throw angle and power
 * shoot in the basket?
 * score
 * texture
 */
import {defs, tiny} from './examples/common.js';
import {create_scoreboard} from './score-board.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;
const {Cube, Axis_Arrows, Textured_Phong, Phong_Shader, Basic_Shader, Subdivision_Sphere} = defs

class Basketball{
    constructor(initialPosition, initialTime, throwDirection, throwPower, gravity = -9.8)
    {
        this.gravity = gravity;
        // this.basePosition = vec4(0, 5, -17.5, 1);
      	this.initialTime = initialTime;
        this.basePosition = initialPosition;
        this.baseTimeZ = initialTime;
        this.baseTimeY = initialTime;
      	this.throwPower = throwPower;
      	this.xDir = throwDirection.dot(vec3(this.throwPower, 0, 0))
        this.zDir = throwDirection.dot(vec3(0, 0, this.throwPower));
        this.yDir = throwDirection.dot(vec3(0, this.throwPower, 0));
      	this.prediction_array = [];
        // console.log(this.zDir);
        // console.log(this.yDir);
    }
		getLifeTime(currTime)
  	{
      	return currTime-this.initialTime;
    }
    calculatePosition(currentTime)
    {
        let timePassed = currentTime - this.baseTimeZ;
        let timePassedY = currentTime - this.baseTimeY;
      	let xOffset = this.xDir * timePassed;
        let zOffset = this.zDir * timePassed;
        let yOffset = this.yDir * timePassedY + 0.5 * this.gravity * (timePassedY ** 2);
        // console.log(this.basePosition);
        let currentPosition = this.basePosition.plus(vec4(xOffset, yOffset, zOffset, 1));

        // Ground collision (bouncing)
        if(this.basePosition[1] + yOffset <= 1)
        {
            this.baseTimeY = currentTime;
            this.basePosition[1] = 1;
            this.yDir = this.yDir * 0.8;
        }
        return currentPosition;
    }
  	calculatePrediction(currentTime)
  	{
      	// let index = 0;
        let backup_baseTimeY = this.baseTimeY;
      	let backup_basePosition = this.basePosition;
      	let backup_yDir = this.yDir;
      
      	for (let i = 0; i < 200; i++)
        {
            let predictionTime = currentTime + i * 0.025
          	this.prediction_array[i] = this.calculatePosition(predictionTime);
        }
      	this.baseTimeY = backup_baseTimeY;
      	this.basePosition = backup_basePosition;
      	this.yDir = backup_yDir;
      	// for(let i = currentTime; i < currentTime + 5.5; i = i + 0.5)
      	// {
      	// this.prediction_array[index] = this.calculatePosition(i);
      	// index++;
      	// }
      	return this.prediction_array
    }
}

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
            lampposts: new defs.Cube(),
            lamplights: new defs.Subdivision_Sphere(3),
          	predbasketball: new defs.Subdivision_Sphere(1),
            ring: new defs.Cylindrical_Tube(15, 15),
            scoreboard: new defs.Cube(),
        };
        // *** Materials
        this.materials = {
            sun: new Material(new defs.Phong_Shader(),
                {ambient: 1, color: hex_color("#ffffff")}),
            floor: new Material(new Phong_Shader(5),
                {color: color(0.5, 0.8, 0.5, 1), ambient: .2, diffusivity: 0.9, specularity: 0.1}),
            stands: new Material(new Phong_Shader(5),
                {ambient: 0.6, diffusivity: 0.6, specularity: 0.8, color: color(1, 1, 1, 1)}),
           	ring: new Material(new Phong_Shader(5),
                {ambient: 0.6, diffusivity: 0.6, specularity: 0.8, color: hex_color("#FFA500")}),
            skybox: new Material(new Phong_Shader(),
                {ambient: 1, diffusivity: 1, color: hex_color("#0000ff")}),
            lampposts: new Material(new Phong_Shader(5),
                {ambient: 0.1, diffusivity: 0.5, specularity: 0, color: hex_color("#808080")}),
            lamplights: new Material(new Phong_Shader(),
                {ambient: 1, color: hex_color("#ffffff")}),
            basketball: new Material(new Textured_Phong(),
                {
                    color: hex_color("#000000"),//background color should be black
                    ambient: 1.0,
                    texture: new Texture("assets/basketball.jpg","LINEAR_MIPMAP_LINEAR")
                }),
            predbasketball: new Material(new defs.Phong_Shader(),
                {ambient: 1, color: color(1, 1, 1, 0.2)}),
            litScore: new Material(new Phong_Shader(), 
                {ambient: 1, diffusivity: 0, specularity: 0, color: color(1, 0, 0, 1)}),
            dimScore: new Material(new Phong_Shader(), 
                {ambient: 0.4, diffusivity: 1, specularity: 0, color: color(0.7, 0.7, 0.7, 0.3)}),
            scoreboard: new Material(new Phong_Shader(5), 
                {ambient: 0.6, diffusivity: 0.6, specularity: 0.8, color: color(1, 1, 1, 1)}),
        }
        // ===== Camera =====
        this.initial_camera_location = Mat4.look_at(vec3(0, 5, -20), vec3(0, 5, 0), vec3(0, 1, 0));
        this.camera_location = vec3(0, 5, -20);
        this.return_to_initial = false;
        // ===== Basketball =====
        this.initial_basketball_position = vec4(0, 5, -17.5, 1);
        this.hitThrow = false;
        this.basketball;
      	this.basketball_position = this.initial_basketball_position;
      	this.basketball_direction = vec3(0, 1, 1).normalized();
      	this.basketball_power = 20.0;
        // ===== Score =====
        this.score = 0;
    }

    make_control_panel() {
        this.key_triggered_button("Return to throwing position", ["k"], () => {this.return_to_initial = true;});
        this.new_line();
        this.key_triggered_button("Throw basketball", ["t"], () => {this.hitThrow = true;});
        this.new_line();
        this.key_triggered_button("randomize position", ["Control", "0"], () => this.randomize = true);
        this.new_line();
        this.key_triggered_button("score +1", ["7"], () => this.score = (this.score + 1) % 100);
    }

    get_lamp_transform(context, program_state, model_transform, lights_on, lamp_height=5, light_color=hex_color("#ffffff")) {
        let lamppost_transform = model_transform
            .times(Mat4.translation(0, lamp_height, 0))
            .times(Mat4.scale(0.1, lamp_height, 0.1));
        let light_transform = model_transform
            .times(Mat4.translation(0, 2*lamp_height, 0))
            .times(Mat4.scale(0.2, 0.2, 0.2));
      	
        let light_position = model_transform.times(Mat4.translation(0, 2*lamp_height, 0)).times(vec4(0, 0, 0, 1));
        if (lights_on) 
            program_state.lights.push(new Light(light_position, light_color, 100));
        else
          	program_state.lights.push(new Light(light_position, light_color, 0));
      	return [lamppost_transform, light_transform];
    }
  
    getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }
    randomize_camera_location(program_state) {
        let y = 5;
        let x = this.getRandomArbitrary(-10, 10);
        let z = this.getRandomArbitrary(-5, -25);
        this.camera_location = vec3(x, y, z);
      	this.basketball_position = this.camera_location;
        this.initial_camera_location = Mat4.look_at(vec3(x, y, z), vec3(0, 5, 30), vec3(0, 1, 0));
      	let xz_dir = vec3(0, 5, 30).minus(this.camera_location);
      	xz_dir.normalize();
      	xz_dir = xz_dir.plus(vec3(0,1,0));
      	this.basketball_direction = xz_dir.normalized();
        program_state.set_camera(this.initial_camera_location.copy());
    }
  
    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        //=============================================== camera section=============================================
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location.copy());
        }
      	if (this.randomize) {
          	this.randomize = false;
          	if (this.basketball==null)
            {
              	this.randomize_camera_location(program_state);
            }
        }
        if (this.return_to_initial)
        {
            program_state.set_camera(this.initial_camera_location.copy());
            this.return_to_initial = false;
            // console.log(this.return_to_initial);
        }
        //===============================================end camera section=============================================
        const pi = Math.PI;
        let model_transform = Mat4.identity();
        program_state.projection_transform = Mat4.perspective(
            pi / 4, context.width / context.height, .1, 1000);
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        //=============================================== The sun =============================================
        let sun_transform = model_transform
            .times(Mat4.rotation(-(2./60.) * pi * t - pi / 2., 0, 0, 1))
            .times(Mat4.translation(-25, 0, 45))
            .times(Mat4.scale(3, 3, 3));
        let sun_position = sun_transform.times(vec4(0, 0, 0, 1));
        let white = hex_color("#ffffff");
        let orange = hex_color("#FFD580");
        let sun_phase = Math.sin(Math.abs((4./60.) * pi * t + pi / 2));
        let sun_color = orange.times(1-sun_phase).plus(white.times(sun_phase));
        // The parameters of the Light are: position, color, size
        if (sun_position.dot(vec4(0, 1, 0, 0)) < -1)
            program_state.lights = [new Light(sun_position, sun_color, 0)];
        else
            program_state.lights = [new Light(sun_position, sun_color, 10**5)];


        //=============================================== skybox =============================================
        let skybox_transform = Mat4.scale(60, 40, 50);
        let skybox_color_light = color(0.4, 0.7, 1, 1);
        let skybox_color_dark = color(0, 0, 0.2, 1);
        let skybox_color_period = - 0.5 * Math.cos((2./60.) * pi * t) + 0.5
        let skybox_color = (skybox_color_light.times(1 - skybox_color_period)).plus(skybox_color_dark.times(skybox_color_period));

        // floor
        let floor_transform = Mat4.scale(60, 0.1, 40);

        // light
        let lamp_transforms = [];
        let lamp_light_transforms = [];
        let light_num = 4;
        let lights_on = sun_position.dot(vec4(0, 1, 0, 0)) < -1;
        for (let i = 0; i < light_num; i++) {
            let lamppost_transform = model_transform.times(Mat4.translation((-1)**i * 15, 0, 3 + 15 * Math.floor(i/2)));
            let [a, b] = this.get_lamp_transform(context, program_state, lamppost_transform, lights_on);
            lamp_transforms.push(a);
            lamp_light_transforms.push(b);
        }

        //=============================================== define stands =============================================
        let stands_base = Mat4.translation(0,0,30);
        let standscale = 2;
        let stands_board_transform = stands_base.times(Mat4.translation(0, 3.425*standscale, 0));
        stands_board_transform = stands_board_transform.times(Mat4.scale(1.8 * standscale, 1.05 * standscale, 0.1));
        let stands_support_transform = stands_base.times(Mat4.translation(0, 0.5 * 3.425 * standscale, 0));
        stands_support_transform = stands_support_transform.times(Mat4.scale(0.2 * standscale, 0.5 * 3.425 * standscale, 0.1));
        let stands_foundation = stands_base.times(Mat4.translation(0, 0.15*standscale, 0));
        stands_foundation = stands_foundation.times(Mat4.scale(standscale, 0.155* standscale, standscale));
        let ring_position = stands_base.times(Mat4.translation(0, 2.7*standscale, -0.6 * standscale));
        ring_position = ring_position.times(Mat4.rotation(Math.PI, 0, 1, 1));
        ring_position = ring_position.times(Mat4.scale(0.5 * standscale, 0.5 * standscale, 0.2 * standscale));

        //=============================================== score board =============================================
        let scoreboard_things = create_scoreboard(this.score, Mat4.translation(0, 10, 30), this.shapes.scoreboard, [this.materials.litScore, this.materials.dimScore, this.materials.scoreboard]);



        //=============================================== draw everything =============================================
        this.shapes.sun.draw(context, program_state, sun_transform, this.materials.sun.override({color: sun_color}));
        this.shapes.skybox.draw(context, program_state, skybox_transform, this.materials.skybox.override({color: skybox_color}));
        this.shapes.floor.draw(context, program_state, floor_transform, this.materials.floor);
        this.shapes.stands.draw(context, program_state, stands_board_transform, this.materials.stands);
        this.shapes.stands.draw(context, program_state, stands_support_transform, this.materials.stands);
        this.shapes.stands.draw(context, program_state, stands_foundation, this.materials.stands);
        this.shapes.ring.draw(context, program_state, ring_position, this.materials.ring);
        for(let i = 0; i < light_num; i++) {
            this.shapes.lampposts.draw(context, program_state, lamp_transforms[i], this.materials.lampposts);
            if (lights_on)
                this.shapes.lamplights.draw(context, program_state, lamp_light_transforms[i], this.materials.lamplights);
            else
                this.shapes.lamplights.draw(context, program_state, lamp_light_transforms[i], this.materials.lamplights.override({color: hex_color("#808080")}));
        }
        for (let each of scoreboard_things) {
            each.shape.draw(context, program_state, each.transform, each.material);
        }

        //=============================================== basketball =============================================

        if (this.hitThrow)
        {
            this.hitThrow = false;
            this.basketball = new Basketball(this.basketball_position, t, this.basketball_direction, this.basketball_power);
        }
        if (this.basketball)	// if a basketball exists (in the throwing process), display the basketball's movement
        {
          	if (this.basketball.getLifeTime(t) > 10)	// each trial's duration is 10 seconds
            {
          			this.basketball = null;
              	this.randomize_camera_location(program_state);
            }
          	else
            {
              	let basketball_coord = this.basketball.calculatePosition(t);
              	let basketball_transform = Mat4.translation(basketball_coord[0], basketball_coord[1], basketball_coord[2]);
              	this.shapes.basketball.draw(context, program_state, basketball_transform, this.materials.basketball);
              	// let predarray = this.basketball.calculatePrediction(t);
              	// for (let i = 0; i < predarray.length; i++)
              	// {
              	// let curr_pred = predarray[i]
              	// let predbasketball_transform = Mat4.translation(curr_pred[0], curr_pred[1], curr_pred[2]).times(Mat4.scale(0.4, 0.4, 0.4));
              	// this.shapes.predbasketball.draw(context, program_state, predbasketball_transform, this.materials.predbasketball);
              	// }
            }
        }
      	else	// if no basketball exist (not in the throwing process), display the expected trajectory
        {
          	let placeholder_basketball = new Basketball(this.basketball_position, t, this.basketball_direction, this.basketball_power);
          	let predarray = placeholder_basketball.calculatePrediction(t);
          	for (let i = 0; i < predarray.length; i++)
          	{
              	let curr_pred = predarray[i]
                let predbasketball_transform = Mat4.translation(curr_pred[0], curr_pred[1], curr_pred[2]).times(Mat4.scale(0.4, 0.4, 0.4));
              	this.shapes.predbasketball.draw(context, program_state, predbasketball_transform, this.materials.predbasketball);
          	}
        }
    }
}