declare interface Object {
	assign(obj1: Object, obj2: Object): Object;
}

declare function require(name: string): any;

/** 对creator.d.ts的补充, 后续从2.2.2版本中挖出来
*/
declare namespace cc {
	/** 对creator.d.ts的补充
	追加cc.Assembler方法
	*/
	export class Assembler {
		public init(comp: cc.RenderComponent);
	}

	export class RenderData {
		createFlexData(index, verticesFloats, indicesCount, vfmt);
	}

	declare interface Game {
		_renderContext: WebGLRenderingContext;
	}

	declare interface Camera {
		position: cc.Vec2;
		render(): void;
	}

	declare interface Sprite {
		_spriteFrame: cc.SpriteFrame;
	}

	declare interface renderer {
		// _handle: any;		// 无效
	}

	declare interface Material {
		setProperty(name: string, value: any);
		// static getInstantiatedMaterial(material: Material, comp: RenderComponent): Material;	// 无效
	}

	/** 对creator.d.ts的补充
	creator.d.ts已经导出RenderComponent，此处追加一些方法和成员
	engine\cocos2d\core\components\CCRenderComponent.js
	*/
	declare interface RenderComponent {
		/**
		@param dirty dirty
		*/
		setVertsDirty(): void;

		disableRender(): void;

		_updateColor(): void;

		markForRender(shouldRender: boolean): void;

		_activateMaterial(force: boolean = true): void;

		_vertsDirty: boolean;

		_assembler: cc.Assembler;
	}

	declare interface SpriteFrame {
		uv: number[];
		_rotated: boolean;
		_originalSize: Size;
		_rect: Rect;
		_offset: Vec2;
		vertices: { u: number[], v: number[], x: number[], y: number[], nu: number[], nv: number[], triangles: number[] };
	}

	declare interface RenderData {
		init(assembler: cc.Assembler);
		createQuadData(index, verticesFloats, indicesCount);

		vDatas;
		uintVDatas;
		iDatas;
		meshCount: number;
		_infos;
		_flexBuffer;
	}

	declare interface PhysicsManager {
		_world: b2.World;
	}

	export const gfx: any
}
