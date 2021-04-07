/**
 * Main file - instantiates Person, Office, and OfficeController, which kicks
 * off the "game" loop.
 */

import {
    Person
} from './Person.js';
import {
    Office
} from './Office.js';
import {
    OfficeController
} from './OfficeController.js';


function makeId(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const socket = io('/');

const audioContext = new window.AudioContext();

var person = new Person(makeId(5), socket);
var office = new Office("my-office", person, audioContext, socket);
var officeController = new OfficeController(office, person);