/**
 * Created with proctor.
 * User: meefik
 * Date: 2015-04-10
 * Time: 05:06 PM
 * To change this template use Tools | Templates.
 */
var sequelize = new Sequelize('database', 'username', 'password', {
    dialect: 'sqlite',
    storage: 'database.sqlite'
});