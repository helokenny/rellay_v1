/* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/

const arrayToObject = (array) => {

  array = Array.isArray(array) ? array : [array];

  const obj = {};
  array.forEach(a => {
    obj[a.id] = a;
  })

  return obj;

}

module.exports = arrayToObject;
