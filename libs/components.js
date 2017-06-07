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
  var info = {}
  info['uid'] = uid
  info['css'] = css
  info['code'] = code
  info['src'] = 'custom_icons'
  info['selected'] = true
  info['svg'] = {'path' : svg_path, 'width': width};
  info['search'] = []
  info['search'].push(css)
  return info
}

function fillConfigParams(glyphs_info) {
  var config = {}
  config['name'] = ''
  config['css_prefix_text'] = 'icon-'
  config['css_use_suffix'] = false
  config['hinting'] = true
  config['units_per_em'] = 1000
  config['ascent'] = 850
  config['glyphs'] = glyphs_info
  return config
}

function sendFile() {
  shell.exec("curl --form 'config=@./config.json' http://fontello.com",function(code, stdout, stderr) {
    var session_id = stdout
    var target_url = "http://fontello.com/" + session_id + '/get'
    var command = "curl -o ./font.zip" + " " + target_url
    shell.exec(command)
  })
}

module.exports = {
  prepareConfigFile: function() {
    var glyphs_info = []
    var config_file_exists = false
    var svgs = fs.readdirSync('./svgs')
    svgs.forEach(function(file){
      if (path.extname(file) == '.svg') {
        var path_name = path.join('./svgs', file)
        var data = fs.readFileSync(path_name, 'utf8')
        var result = svg_image_flatten(data)
        var height = result.height
        var scale = 1000 / height
        var width = Math.round(result.width * scale)
        var d = new SvgPath(result.d).translate(-result.x, -result.y).scale(scale).abs().round(1).toString();
        var css = path.basename(file).split('.')[0]
        var uid = hexCode()
        var code = fiveDigitCode()
        var single_glyph_info = singleGiphyInfo(uid, css, code, d, width)
        glyphs_info.push(single_glyph_info)
      }
    })
    // if there is an existing config.json file, then we need to extract the existing info and insert it into the glyphs_info as well
    var files = fs.readdirSync('.')
    files.forEach(function(file) {
      if (path.extname(file) == '.json') {
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
    var config_file = JSON.stringify(fillConfigParams(glyphs_info))
    fs.writeFile('./config.json', config_file, 'utf8')
    sendFile()
  }
}

