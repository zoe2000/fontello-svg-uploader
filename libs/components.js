var svg_image_flatten = require('../libs/_svg_image_flatten.js')
var SvgPath = require('svgpath');
var fs = require('fs');
var path = require('path');
var parser = require('xml2json');
var Random = require('random-js')
var engine = Random.engines.mt19937().autoSeed();
var shell = require('shelljs')

function fiveDigitCode() {
  var array = []
  for (var i = 0; i < 5; i++) {
    array[i] = Random.integer(1,9)(engine)
  }
  var result = array.join('')
  return parseInt(result)
}

function hexCode() {
  var code = Random.hex()(engine, 32)
  return code
}

function singleGiphyInfo(uid, css, code, svg_path, width) {
  var info = { uid: uid, css: css, code: code, src: 'custom_icons', selected: true, svg: { path: svg_path, width: width}, search: [css] }
  return info
}

function fillConfigParams(glyphs_info) {
  var config = { name: '', css_prefix_text: 'icon-', css_use_suffix: false, hinting: true, units_per_em: 1000, ascent: 850, glyphs: glyphs_info }
  return config
}

function sendFile(glyphs_info) {
  if (glyphs_info.length > 0) {
    var config_file = JSON.stringify(fillConfigParams(glyphs_info))
    fs.writeFile('./config.json', config_file, 'utf8')
    shell.exec("curl --form 'config=@./config.json' http://fontello.com",function(code, stdout, stderr) {
      var session_id = stdout
      var target_url = "http://fontello.com/" + session_id + '/get'
      var command = "curl -o ./font.zip" + " " + target_url
      shell.exec(command)
    })
  } else {
    throw 'There is no valid svg file in the directory, please check again'
  }

}

function checkExistingConfigFile(config_file_exists) {
  var files = fs.readdirSync('.')
  files.forEach(function(file) {
    if (path.basename(file) == 'config.json') {
      config_file_exists = true
      var existing_font_info = JSON.parse(fs.readFileSync('./config.json','utf8')).glyphs
      existing_font_info.forEach(function(item) {
        glyphs_info.push(item)
      })
    }
  })
  if (config_file_exists) {
    var remove_file_command = 'rm ./config.json'
    shell.exec(remove_file_command)
  }
}

function prepareConfigFile(glyphs_info) {
  var svgs = fs.readdirSync('./svgs')
  svgs.forEach(function(file) {
    if (path.extname(file) == '.svg') {
      var path_name = path.join('./svgs', file)
      var data = fs.readFileSync(path_name, 'utf8')
      // TO DO: throw exceptions and catch
      var result = svg_image_flatten(data)
      if (result.d) {
        var scale = 1000 / result.height
        var width = Math.round(result.width * scale)
        var d = new SvgPath(result.d).translate(-result.x, -result.y).scale(scale).abs().round(1).toString();
        glyphs_info.push(singleGiphyInfo(hexCode(),path.basename(file).split('.')[0], fiveDigitCode(), d, width))
      } else {
        var file = path.basename(file)
        throw 'Sorry, there is something wrong with this svg: ' + file + '. Please fix it and retry.' 
      }

    }
  })
}

module.exports = {
  uploadSVG: function() {
    var glyphs_info = []
    var config_file_exists = false
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

