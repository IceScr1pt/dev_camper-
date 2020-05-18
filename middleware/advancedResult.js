const advancedResults = (model, populate) => async (req, res, next) => {
  /*getting all bootcamps from the db with .find() => give back all the bootcamps from the db
    req.query give me an object that contain the query parametrs i did on the request automatically
    so in order to filter by specific query i just pass req.query to .find()
    */
  let query;

  //Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude from reqQuery because i dont it want as a field
  const removeFields = ['select', 'sort', 'page', 'limit'];
  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);
  console.log('before we stringify', reqQuery);

  //make the query a string in order to manipluate it
  let queryStr = JSON.stringify(reqQuery);
  console.log('after we stringify and without delete', queryStr);

  /*search for a word and replace it with word boundring reguler exp, if the string is :{"averageCost":{"$lte":" 10000"}} , we look for the words in () 
   if we have a  match we replace the word with $word 
   */
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => {
    console.log('the query -> ', queryStr);
    console.log('The match -> ', match);
    return `$${match}`;
  });

  console.log('before db search', queryStr);
  //setting the query to Json and find bootcamps by the replaced query
  query = model.find(JSON.parse(queryStr));

  //SELECT Fields
  console.log(req.query);
  if (req.query.select) {
    //make it an array
    const fields = req.query.select.split(',').join(' ');
    console.log(fields);
    query = query.select(fields);
  }

  //Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    //sort the boot camps by descading order from top to buttom
    query = query.sort('-createdAt');
  }

  //pagintaion
  const page = parseInt(req.query.page, 10) || 1;
  console.log(page);
  //specify how many records i want to search for
  const limit = parseInt(req.query.limit, 10) || 25;

  //where to start, decide if im at the first page or not
  const startIndex = (page - 1) * limit;
  console.log(startIndex);

  //number of documents
  const endIndex = page * limit;
  console.log(endIndex);

  //count the number of documents (bootcamps) in the db
  const total = await model.countDocuments();
  console.log(total);

  query = query.skip(startIndex).limit(limit);

  //if something was passed in to the populate var
  if (populate) {
    query = query.populate(populate);
  }

  //searching in DB
  const results = await query;

  //paginatin result
  const pagination = {};

  /*
   if the endIndex which is the page number which represent the number of records i want to find is less than the total records
   then i can add a 'next' key which contain data about what is the next page
   */
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  /*
   if we are not in the first page, which mean we sepcifed a page valuie geater than 1 then i can have a 'prev' key which contaain  data what is the previous page 
   */
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  //making an object that res could have access to and get all results from a resource
  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };
  next();
};

module.exports = advancedResults;
