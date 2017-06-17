require('source-map-support').install();
let readFileSync = require('fs').readFileSync
let {
  readFromNodeBuffer
} = require('../node-build')
let Benchmark = require('benchmark')

for (let index = 2; index < process.argv.length; index++) {
  let filename = process.argv[index]
  console.log('file', filename)
  processFile(filename)
  console.log('--------\n\n')
}

function processFile(filename) {
  let buffer = readFileSync(filename)
  let bench = new Benchmark(`CFB#${filename}`, function () {
      readFromNodeBuffer(buffer).root
    }, {
      defer: false,
      onComplete: function () {
        console.log(`number of operations per second ${bench.hz}`)
        console.log(`mean execution time ${bench.stats.mean}`)
        console.log(`margin of error ${bench.stats.moe}`)
      }
    })
  bench.run({ 'async': false })
  let cfb = readFromNodeBuffer(buffer)
  let header = cfb.header
  let sectors = cfb.sectors
  console.log('signature', header.signature())
  console.log('version', header.version())
  console.log('bytesOrder', header.bytesOrder())
  console.log('start of directoryChain', header.getStartOfDirectoryChain())
  console.log('start of minifat', header.getStartOfMiniFat())
  console.log('start of difat', header.getStartOfDifat())
  console.log('sector size', header.sectorSize())
  console.log('number of fat sectors', header.getNumberOfFatSectors())
  console.log('number of sectors', sectors.length)
  console.log('number of chains', cfb.fatChain.size)
  cfb.fatChain.forEach((buffer, startIndex) => {
    console.log(`startIndex ${startIndex}, byteLength ${buffer.byteLength}`)
  })

  function leftpad(str, len) {
    str = String(str);
    let i = -1;
    let ch = ' ';
    len = len - str.length;
    while (++i < len) {
      str = ch + str;
    }
    return str;
  }

  function rightpad(str, len) {
    str = String(str);
    let i = -1;
    let ch = ' ';
    len = len - str.length
    while (++i < len) {
      str = str + ch;
    }
    return str;
  }

  function ignoreSpecialValues(value) {
    return value <= 0xFFFFFFFA ? value.toString() : '-'
  }

  console.log('Directory entries')
  console.log(['index', rightpad('name', 32), 'sector', 'size',
    rightpad('leftId', 8), rightpad('rightId', 8), rightpad('childId', 8)
  ].join('\t'))
  cfb.directoryEntries.forEach((entry, index) => {
    console.log([index,
      rightpad(entry.getName(), 32),
      ignoreSpecialValues(entry.getStartingSectorLocation()),
      entry.getStreamSize(),
      leftpad(ignoreSpecialValues(entry.getLeftId()), 8),
      leftpad(ignoreSpecialValues(entry.getRightId()), 8),
      leftpad(ignoreSpecialValues(entry.getChildId()), 8)
    ].join('\t'))
  })

  console.log('directories', cfb.root)
}
