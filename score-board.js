import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material
} = tiny;
const {Cube, Axis_Arrows, Textured_Phong, Phong_Shader, Basic_Shader, Subdivision_Sphere} = defs

// create an 7 segment display
//    0
//    —
// 1 | | 2
// 3  —
// 4 | | 5
//    —
//    6
// unit: the default width of a cube. all translations should be multiplied by this
export function create_scoreboard(score, translation, shape, materials, unit=2) {
    let transform = translation;
    let cube = shape;
    let a = 0.1;    // width of the segments
    let b = 0.3;    // length of the segments 
    let c = 0.2;    // margin and gap
    let w = 4 * a + 2 * b + 3 * c;
    let h = 3 * a + 2 * b + 2 * c;

    const generate_segment = (id, lit, trans) => {
        let obj = {};
        if (id % 3 != 0)
            obj.transform = trans.times(Mat4.scale(a, b, 0.1));
        else
            obj.transform = trans.times(Mat4.scale(b, a, 0.1));
        if (lit)
            obj.material = materials[0];
        else
            obj.material = materials[1];
        obj.shape = cube;
        return obj;
    }
    const generate_digit = (number) => {
        let lit_array = [];
        if (number === 0) lit_array = [true, true, true, false, true, true, true];
        if (number === 1) lit_array = [false, false, true, false, false, true, false];
        if (number === 2) lit_array = [true, false, true, true, true, false, true];
        if (number === 3) lit_array = [true, false, true, true, false, true, true];
        if (number === 4) lit_array = [false, true, true, true, false, true, false];
        if (number === 5) lit_array = [true, true, false, true, false, true, true];
        if (number === 6) lit_array = [true, true, false, true, true, true, true];
        if (number === 7) lit_array = [true, false, true, false, false, true, false];
        if (number === 8) lit_array = [true, true, true, true, true, true, true];
        if (number === 9) lit_array = [true, true, true, true, false, true, true];
        let move = Mat4.translation;
        const zoffset = -0.05;
        let trans = [
            move(0, (a+b)*unit, zoffset*unit), 
            move((a+b)/2*unit, (a+b)/2*unit, zoffset*unit), 
            move(-(a+b)/2*unit, (a+b)/2*unit, zoffset*unit),
            move(0, 0, zoffset*unit),
            move((a+b)/2*unit, -(a+b)/2*unit, zoffset*unit),
            move(-(a+b)/2*unit, -(a+b)/2*unit, zoffset*unit),
            move(0, (-a-b)*unit, zoffset*unit)
        ];
        let segments = [];
        for (let i = 0; i < 7; i++) {
            segments.push(generate_segment(i, lit_array[i], trans[i]));
        }
        return segments;
    }
    const generate_board = () => {
        let obj = {};
        obj.shape = cube;
        obj.material = materials[2];
        obj.transform = Mat4.scale(w, h, 0.1);
        return obj;
    }
    score %= 100;
    score = score.toLocaleString('en-US', {minimumIntegerDigits: 2});
    let digit1 = generate_digit(Number.parseInt(score[0]));
    for (let i = 0; i < digit1.length; i++) 
        digit1[i].transform = transform.times(Mat4.translation((a+b+c)/2*unit, 0, 0).times(digit1[i].transform));
    let digit2 = generate_digit(Number.parseInt(score[1]));
    for (let i = 0; i < digit2.length; i++) 
        digit2[i].transform = transform.times(Mat4.translation(-(a+b+c)/2*unit, 0, 0).times(digit2[i].transform));
    let board = generate_board();
    board.transform = transform.times(board.transform);
    return [board, ...digit1, ...digit2];
}