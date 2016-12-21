import * as THREE from 'three';
import * as Rx from 'rx';
import * as picoModal from 'picomodal';
import Ractive from 'ractive';

window.THREE= THREE;

class Renderer
{
    constructor(opts= {})
    {
        this.el= opts.el;
        this.stream= opts.stream;

        this.initialize(this.el);
    }

    initialize()
    {
        const camera= new THREE.PerspectiveCamera(40, this.el.clientWidth / this.el.clientHeight, 1, 10000);
        camera.position.z= 500;

        const scene= new THREE.Scene();

        const light= new THREE.DirectionalLight(0xffffff);
        light.position.set(0.5, 1, 1).normalize();
        scene.add(light);

        const renderer= new THREE.WebGLRenderer({
            antialias: false,
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(this.el.clientWidth, this.el.clientHeight);
        this.el.appendChild(renderer.domElement);

        const texture= new THREE.VideoTexture((() => {
            const el= document.createElement('video');
            el.srcObject= this.stream;
            el.autoplay= true;
            el.style.display= 'none';
            this.el.appendChild(el);
            return el;
        })());
        texture.minFilter= THREE.LinearFilter;
        texture.magFilter= THREE.LinearFilter;
        texture.format= THREE.RGBFormat;

        {
            const changeUvs= (geometry, unitx, unity, offsetx, offsety) => {
                const faceVertexUvs= geometry.faceVertexUvs[0];
                for(let i= 0; i < faceVertexUvs.length; ++i)
                {
                    const uvs= faceVertexUvs[i];
                    for(let j= 0; j < uvs.length; ++j)
                    {
                        const uv= uvs[j];
                        uv.x= (uv.x + offsetx) * unitx;
                        uv.y= (uv.y + offsety) * unity;
                    }
                }
            };

            const xgrid= 1;
            const ygrid= 1;
            const ux= 1 / xgrid;
            const uy= 1 / ygrid;
            const xsize= 480 / xgrid;
            const ysize= 204 / ygrid;
            const parameters= {
                color: 0xffffff,
                map: texture,
            };
            const materials= [];
            const meshes= [];

            for(let i= 0; i < xgrid; ++i)
            {
                for(let j= 0; j < ygrid; ++j)
                {
                    const ox= i;
                    const oy= j;
                    const geometry= new THREE.BoxGeometry(xsize, ysize, xsize);

                    changeUvs(geometry, ux, uy, ox, oy);

                    const material= new THREE.MeshLambertMaterial(parameters);
                    material.hue= i / xgrid;
                    material.saturation= 1 - j / ygrid;
                    material.color.setHSL(material.hue, material.saturation, 0.5);
                    materials.push(material);

                    const mesh= new THREE.Mesh(geometry, material);
                    mesh.position.x= (i - xgrid / 2) * xsize;
                    mesh.position.y= (j - ygrid / 2) * ysize;
                    mesh.position.z= 0;
                    mesh.scale.x= mesh.scale.y= mesh.scale.z= 1;
                    scene.add(mesh);

                    mesh.dx= 0.001 * (0.5 - Math.random());
                    mesh.dy= 0.001 * (0.5 - Math.random());
                    meshes.push(mesh);
                }
            }

            renderer.autoClear= false;
        }

        this.camera= camera;
        this.scene= scene;
        this.renderer= renderer;
    }

    render()
    {
        this.camera.lookAt(this.scene.position);
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(() => this.render());
    }
}

function main()
{
    const videoDevicesSource= Rx.Observable.fromPromise(navigator.mediaDevices.enumerateDevices())
        .flatMap((devices) => devices)
        .filter((device) => device.kind === 'videoinput')
    ;
    const deviceChooser= new Ractive({
        el: '#device-chooser',
        template: require('device-chooser.html'),
        data: {
            deviceId: undefined,
            devices: [],
        },
    });
    videoDevicesSource.subscribe((device) => deviceChooser.push('devices', device));

    const deviceIdSource= new Rx.BehaviorSubject();

    deviceChooser.on('go', () => deviceIdSource.onNext(deviceChooser.get('deviceId')));

    deviceIdSource
        .asObservable()
        .filter((deviceId) => !!deviceId)
        .subscribe((deviceId) => {
            const constraint= {
                video: {
                    optional: [
                        { sourceId: deviceId },
                    ],
                },
            };
            const streamSource= Rx.Observable.fromPromise(navigator.mediaDevices.getUserMedia(constraint));
            streamSource.subscribe((stream) => {
                const vtracks= stream.getVideoTracks();
                console.log('got devices:');
                vtracks.forEach((vtrack) => console.log(`  - ${vtrack.label}`));

                const renderer= new Renderer({
                    el: document.querySelector('#container'),
                    stream: stream,
                });
                renderer.render();
            });
        })
    ;
}

document.addEventListener('DOMContentLoaded', () => navigator.mediaDevices.getUserMedia({video: true}).then(main));
