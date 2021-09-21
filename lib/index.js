// import imagemin from 'gulp-imagemin';
const {src,dest,parallel,series,watch} = require('gulp')
const del = require('del')
const browserSync = require('browser-sync')

const loadPlugins = require('gulp-load-plugins')

const plugins = loadPlugins()
const bs = browserSync.create()
const cwd = process.cwd()
let config = {
    //default config
    build:{
        src:'src',
        dist:'dist',
        temp:'temp',
        public:'public',
        paths:{
            styles:'assets/style/*.scss',
            script:'assets/scripts/*.js',
            pages:'*.html',
            images:'assets/images/**',
            fonts:'assets/fonts/**'
        }
    }
}
try {
    const loadConfig = require(`${cwd}/pages.config.js`)
    config = Object.assign({},config,loadConfig)
} catch (error) {
    
}
const clean = () => {
    return del([config.build.dist,config.build.temp])
}

const style = () => {
    return src(config.build.paths.styles, { base:config.build.src,cwd:config.build.src })
        .pipe(plugins.sass({outputStyle:'expanded'}))
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({stream:true}))
}

const script = () => {
    return src(config.build.paths.script, { base:config.build.src,cwd:config.build.src })
        .pipe(plugins.babel({presets:[require('@babel/preset-env')]}))
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({stream:true}))

}

const page = () =>{
    return src(config.build.paths.pages , { base:config.build.src,cwd:config.build.src })
        .pipe(plugins.swig({cache:'false',data: config.data}))
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({stream:true}))

}

const image = () => {
    return src(config.build.paths.images , { base:config.build.src,cwd:config.build.src })
        .pipe(plugins.imagemin())
        .pipe(dest(config.build.dist))
}

const font = () => {
    return src(config.build.paths.fonts , { base:config.build.src,cwd:config.build.src })
        .pipe(plugins.imagemin())
        .pipe(dest(config.build.dist))
}
const extra = () => {
    return src('**', { base:config.build.public,cwd:config.build.public })
        .pipe(dest(config.build.dist))
}

const serve = () => {
    watch(config.build.paths.styles,{cwd:config.build.src}, style)
    watch(config.build.paths.script,{cwd:config.build.src},  script)
    watch(config.build.paths.pages,{cwd:config.build.src}, page)
    // watch('src/assets/images/**', image)
    // watch('src/assets/fonts/**', font)
    // watch('public/**', extra)
    watch([
        config.build.paths.images,
        config.build.paths.fonts,
    ],{cwd:config.build.src},bs.reload)

    watch('**',{cwd:config.build.public}, bs.reload)



    bs.init({
        notifiy:false,
        port:8080,
        // open: false,
        // files:'dist/**',
        server:{
            baseDir:[config.build.temp,config.build.dist,config.build.public],
            routes:{
                '/node_modules':'node_modules'
            }
        }
    })
} 

//针对   <!-- build:css assets/styles/vendor.css --> 进行压缩
const useref = () => {
    return src(config.build.paths.pages, {base:config.build.temp,cwd:config.build.temp})
        .pipe(plugins.useref({searchPath:[config.build.temp,'.']}))
        .pipe(plugins.if(/\.js$/, plugins.uglify()))
        .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
        .pipe(plugins.if(/\.html$/, plugins.htmlmin({
            collapseWhitespace:true,
            minifyCSS:true,
            minifyJS:true
        })))
        .pipe(dest(config.build.dist))
}
const lint = () =>{
    return src(config.build.script,{base:config.build.src,cwd:config.build.src})
        .pipe(standard())
        .pipe(standard.reporter('default', {quit:true}))
}

const compile = parallel(style,script,page)

const bulid  = series(
    clean,
    parallel(
        serise(compile,useref),
        extra,
        image,
        font
    )
)

const start = series(compile,serve)


module.exports = {
    lint,
    clean,
    bulid,
    start,
    serve
}