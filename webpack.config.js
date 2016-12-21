const path= require('path');
const webpack= require('webpack');

module.exports= {
    entry: {
        app: path.join(__dirname, 'src', 'main', 'js', 'app.js'),
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'dist', 'assets', 'js'),
    },
    plugins: [
        new webpack.OldWatchingPlugin(),
    ],
    module: {
        loaders: [
            { test: /\.js$/,   loaders: ['babel'], exclude: /node_modules/ },
            { test: /\.html$/, loaders: ['html'] },
        ],
    },
    resolve: {
        extensions: ['', '.js'],
        root: [
            path.join(__dirname, 'src', 'main', 'js'),
            path.join(__dirname, 'src', 'main', 'template'),
        ],
    },
    devtool: '#source-map',
};
