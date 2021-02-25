const gfx = cc.gfx;
const { ccclass, property, executeInEditMode, requireComponent } = cc._decorator;

@ccclass
@executeInEditMode
@requireComponent(cc.MeshRenderer)
export default class MeshPolygonSprite extends cc.Component {

	@property
	_offset: cc.Vec2 = cc.v2(0, 0);
	/**
	 * !#en Position offset
	 * !#zh 位置偏移量
	 * @property offset
	 * @type {Vec2}
	 */
	get offset() {
		return this._offset;
	}
	@property({ type: cc.Vec2, tooltip: '位置偏移量' })
	set offset(value) {
		this._offset = value;
		this._updateMesh();
		this._applyVertexes();
	}

	@property
	_spriteFrame: cc.SpriteFrame = null;
	/**
	 * !#en The sprite frame of the sprite.
	 * !#zh 精灵的精灵帧
	 * @property spriteFrame
	 * @type {SpriteFrame}
	 * @example
	 * sprite.spriteFrame = newSpriteFrame;
	 */
	get spriteFrame() {
		return this._spriteFrame;
	}
	@property({ type: cc.SpriteFrame, tooltip: '精灵的精灵帧' })
	set spriteFrame(value) {
		if (this._spriteFrame == value) return;
		this._spriteFrame = value;
		this._resetVertexes();
		this._refreshAll();
	}

	@property
	_vertexes: cc.Vec2[] = [cc.v2(0, 0), cc.v2(0, 100), cc.v2(100, 100), cc.v2(100, 0)];
	/**
	 * !#en Position vertexes
	 * !#zh 顶点坐标
	 * @property vertexes
	 * @type {Vec2}
	 */
	get vertexes() {
		return this._vertexes;
	}
	@property({ type: cc.Vec2, tooltip: '顶点坐标' })
	set vertexes(value) {
		this._vertexes = value;
		this._resetNodeSize();
		this._updateMesh();
		this._applyVertexes();
	}

	private renderer: cc.MeshRenderer = null;
	private mesh: cc.Mesh = null;
	private _meshCache: { [key: number]: cc.Mesh } = {};

	onLoad() {
		this._meshCache = {};
		const renderer = this.node.getComponent(cc.MeshRenderer) || this.node.addComponent(cc.MeshRenderer);

		renderer.mesh = null;
		this.renderer = renderer;

		let builtinMaterial = cc.Material.getBuiltinMaterial('unlit');
		renderer.setMaterial(0, builtinMaterial);
	}

	onEnable() {
		this._refreshAll();
	}

	_resetVertexes() {
		this._vertexes.length = 0;
		let node = this.node, frame = this.spriteFrame,
			cw = frame?._originalSize.width, ch = frame?._originalSize.height,
			appx = node.anchorX * cw, appy = node.anchorY * ch,
			nw = node.width, nh = node.height,
			anx = node.anchorX * nw, any = node.anchorY * nh;
		if (this.spriteFrame)
			this._vertexes.push(cc.v2(-appx, -appy), cc.v2(cw - appx, -appy), cc.v2(cw - appx, ch - appy), cc.v2(-appx, ch - appy));
		else
			this._vertexes.push(cc.v2(-anx, -any), cc.v2(nw - anx, -any), cc.v2(nw - anx, nh - any), cc.v2(-anx, nh - any));
		this._resetNodeSize();
	}

	_resetNodeSize() {
		let x = 0, y = 0;
		this._vertexes.forEach(value => {
			x = Math.max(x, Math.abs(value.x));
			y = Math.max(y, Math.abs(value.y));
		});
		this.node.setContentSize(x * 2, y * 2);
	}

	_refreshAll() {
		this._resetNodeSize();
		this._updateMesh();
		this._applySpriteFrame();
		this._applyVertexes();
	}

	_updateMesh() {
		let mesh = this._meshCache[this.vertexes.length];
		if (!mesh) {
			mesh = new cc.Mesh();
			mesh.init(new gfx.VertexFormat([
				{ name: gfx.ATTR_POSITION, type: gfx.ATTR_TYPE_FLOAT32, num: 2 },
				{ name: gfx.ATTR_UV0, type: gfx.ATTR_TYPE_FLOAT32, num: 2 }
			]), this.vertexes.length, true);
			this._meshCache[this.vertexes.length] = mesh;
		}
		this.mesh = mesh;
	}

	_applySpriteFrame() {
		if (this.spriteFrame) {
			const renderer = this.renderer;
			let material = renderer.getMaterial(0);
			// Reset material
			let texture = this.spriteFrame.getTexture();
			material.define('USE_DIFFUSE_TEXTURE', true);
			material.setProperty('diffuseTexture', texture);
		} else if (this.renderer)
			this.renderer.mesh = null;
	}

	// 更新定点
	_applyVertexes() {
		// 设置坐标
		const mesh = this.mesh;
		mesh.setVertices(gfx.ATTR_POSITION, this.vertexes);

		this._calculateUV();

		if (this.vertexes.length >= 3) {
			// 计算顶点索引
			const ids = [];
			// 多边形切割 poly2tri，支持简单的多边形，确保顶点按顺序切不自交
			const countor = this.vertexes.map((p) => { return { x: p.x, y: p.y } });
			const swctx = new poly2tri.SweepContext(countor, { cloneArrays: true });

			try {
				// 防止失败 使用try
				swctx.triangulate();
				const triangles = swctx.getTriangles();

				triangles.forEach((tri) => {
					tri.getPoints().forEach(p => {
						const i = countor.indexOf(p as any);
						ids.push(i);
					})
				})
			} catch (e) {
				cc.error('poly2tri error', e);
			}

			if (ids.length === 0) {
				cc.log('计算顶点索引 失败');
				ids.push(...this.vertexes.map((v, i) => { return i }));
			}
			mesh.setIndices(ids);
			this.renderer.mesh = mesh;
		}
	}

	_calculateUV() {
		const mesh = this.mesh;
		if (this.spriteFrame) {
			const uv = this.spriteFrame.uv;
			const texture = this.spriteFrame.getTexture();
			/**
			 *    t
			 * l     r
			 *    b
			 */
			let uv_l = uv[0];
			let uv_r = uv[6];
			let uv_b = uv[3];
			let uv_t = uv[5];
			if (this.spriteFrame.isRotated()) {
				uv_l = uv[5];
				uv_r = uv[3];
				uv_b = uv[0];
				uv_t = uv[6];
			}

			const size = this.spriteFrame._originalSize;
			// let node = this.node,
			// 	cw = node.width, ch = node.height,
			// 	appx = node.anchorX * cw, appy = node.anchorY * ch;
			// let frame = this.spriteFrame,
			// 	ow = frame._originalSize.width, oh = frame._originalSize.height,
			// 	rw = frame._rect.width, rh = frame._rect.height,
			// 	offset = frame._offset,
			// 	scaleX = cw / ow, scaleY = ch / oh;

			// 计算uv
			const uvs = [];
			for (const pt of this.vertexes) {
				const u = this._lerp(uv_l, uv_r, (pt.x + size.width / 2 + this.offset.x) / size.width);
				const v = this._lerp(uv_b, uv_t, (pt.y + size.height / 2 - this.offset.y) / size.height);
				if (this.spriteFrame.isRotated())
					uvs.push(cc.v2(v, u));
				else
					uvs.push(cc.v2(u, v));
			}
			mesh.setVertices(gfx.ATTR_UV0, uvs);
		}
	}

	_clamp(a: number, b: number, w: number) {
		if (w < a) return a;
		if (w > b) return b;
		return w;
	}

	_lerp(a: number, b: number, w: number) {
		w = this._clamp(0, 1, w);
		return a + w * (b - a);
	}

}
