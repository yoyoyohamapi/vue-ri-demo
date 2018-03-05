function average(data) {
  const sum = data.reduce((sum, curr) => sum + curr, 0)
  return sum / data.length
}

self.addEventListener('message', ({data}) => self.postMessage(average(data)), false)