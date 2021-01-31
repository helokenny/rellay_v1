const dbauth = ( env ) => {
  
  // let env = "local"; env = 'aws';

  const DBAuth = (env == 'local') ? {
    dbhost: "localhost",
    dbuser: "relifser",
    dbpwrd: "3e562a1Oz7",
    dbdb: "relify",
  } : {
    dbhost: "appiserve.coy1kh6kbwt6.us-east-2.rds.amazonaws.com",
    dbuser: "appiuser",
    dbpwrd: "tTr667YGHhg",
    dbdb: "relidb",
  };
  //sk_test_xxxx to be replaced by your own secret key
  
  return DBAuth;
}

module.exports = dbauth;