function Dog(name) {
  this.name = name
  this.speak = () => 'Woof Woof'
}

//Dog.prototype.speak = function() {
Dog.prototype.speaks = function() {
  return 'Ruff Ruff'
}

const dog = new Dog('Leo')
console.log(dog.speak())
console.log(dog.speaks())
