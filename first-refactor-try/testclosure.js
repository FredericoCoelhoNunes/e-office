class Fred {

    constructor(x) {
        this.x = x;
    }

    f() {
        this.func = () => {
            console.log(this.x)
        }
    }
}

var fred = new Fred(10);

fred.f();

fred.func();

fred.x = 20;

fred.func();