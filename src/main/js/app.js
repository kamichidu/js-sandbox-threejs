import * as THREE from 'three';
import * as Rx from 'rx';
import * as picoModal from 'picomodal';
import Ractive from 'ractive';

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
        this.camera= new THREE.PerspectiveCamera(40, this.el.clientWidth / this.el.clientHeight, 1, 10000);
        this.camera.position.z= 500;

        this.scene= new THREE.Scene();

        const light= new THREE.DirectionalLight(0xffffff);
        light.position.set(0.5, 1, 1).normalize();
        this.scene.add(light);

        this.renderer= new THREE.WebGLRenderer({
            antialias: false,
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.el.clientWidth, this.el.clientHeight);
        this.el.appendChild(this.renderer.domElement);

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

        const xsize= 300;
        const ysize= 300;
        const geometry= new THREE.BoxGeometry(xsize, ysize, xsize);
        const material= new THREE.MeshLambertMaterial({
            color: 0xffffff,
            map: texture,
        });
        const mesh= new THREE.Mesh(geometry, material);
        this.scene.add(mesh);

        this.renderer.autoClear= false;
    }

    rotate(angle)
    {
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

                window.stream= stream;
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
