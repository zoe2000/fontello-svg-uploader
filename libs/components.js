'use strict';
const svg_image_flatten = require('../libs/_svg_image_flatten.js')
const SvgPath = require('svgpath');
const fs = require('fs');
const path = require('path');
const parser = require('xml2json');
const Random = require('random-js')
const engine = Random.engines.mt19937().autoSeed();
const shell = require('shelljs')

let fiveDigitCode = () => {
  const array = Array.from({length: 5}, () => Random.integer(1,9)(engine))
  return parseInt(array.join(''))
}

let singleGiphyInfo = (uid, css, code, path, width) => ({ uid, css, code, src: 'custom_icons', selected: true, svg: { path, width}, search: [css] })


let fillConfigParams = (glyphs_info) => ({ name: '', css_prefix_text: 'icon-', css_use_suffix: false, hinting: true, units_per_em: 1000, ascent: 850, glyphs: glyphs_info })

let sendFile = (glyphs_info) => {
  if (glyphs_info.length > 0) {
    const config_file = JSON.stringify(fillConfigParams(glyphs_info))
    fs.writeFile('./config.json', config_file, 'utf8')
    shell.exec("curl --form 'config=@./config.json' http://fontello.com",(code, stdout, stderr) => {
      const command = `curl -o ./font.zip http://fontello.com/${stdout}/get`
      shell.exec(command)
    })
  } else {
    throw 'There is no valid svg file in the directory, please check again'
  }
}

let checkExistingConfigFile = (config_file_exists) => {
  const files = fs.readdirSync('.')
  files.forEach(file => {
    if (path.basename(file) == 'config.json') {
      config_file_exists = true
      const existing_font_info = JSON.parse(fs.readFileSync('./config.json','utf8')).glyphs
      existing_font_info.forEach(item => {
        glyphs_info.push(item)
      })
    }
  })
  if (config_file_exists) {
    shell.exec('rm ./config.json')
  }
}

let prepareConfigFile = (glyphs_info) => {
  const svgs = fs.readdirSync('./svgs')
  svgs.forEach(file => {
    if (path.extname(file) == '.svg') {
      const path_name = path.join('./svgs', file)
      const data = fs.readFileSync(path_name, 'utf8')
      const result = svg_image_flatten(data)
      if (result.d) {
        const scale = 1000 / result.height
        const width = Math.round(result.width * scale)
        const d = new SvgPath(result.d).translate(-result.x, -result.y).scale(scale).abs().round(1).toString();
        glyphs_info.push(singleGiphyInfo(Random.hex()(engine, 32),path.basename(file).split('.')[0], fiveDigitCode(), d, width))
      } else {
        const file = path.basename(file)
        throw `Sorry, there is something wrong with this file: ${file}. Please fix it and retry.`
      }

    }
  })
}

module.exports = {
  uploadSVG: function() {
    let glyphs_info = []
    let config_file_exists = false
    try {
      prepareConfigFile(glyphs_info)
    } catch(message) {
      console.log(message)
      return
    }
    checkExistingConfigFile(config_file_exists)
    try {
      sendFile(glyphs_info)
    } catch (message) {
      console.log(message)
    }
  }
}

