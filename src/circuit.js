const matrix = require ('matrix-js');

function arrMult (arr1,arr2) {
    return arr1.reduce((acc,el,i) => {return acc + arr1[i]*arr2[i]},0)  
}
function matMult (mat1,mat2) {
    const rowd = []
    rowd.length = mat2(0).length
    rowd.fill(0)
    const d = []
    d.length = mat1().length
    d.fill(rowd)
    let D = matrix(d)
    for (let i=0; i<D().length; i+=1) {
        for (let j=0; j<D(0).length; j+=1) {
            const IJRez = arrMult(mat1(i,[]),matrix(mat2.trans())(j,[]))
            D = matrix(D.set(i,j).to(IJRez))   
        }
    }
    return D
};
function matInterchange (inMat, ind1, ind2) {
    const rez = new Array(inMat)
    const temp = rez[ind1];
    rez[ind1] = rez[ind2];
    rez[ind2] = temp;
    return inMat
};
function matSize(mat) {
    const s = [];
    while (Array.isArray(mat)) {
        s.push(mat.length);
        // eslint-disable-next-line no-param-reassign
        [mat] = mat;
    }
    return s;
};
function matDet (inMat) {
    let mat = inMat.map(el => el);
    const siz = matSize(mat);
    let det = 1;
    let sign = 1;
    for (let i = 0; i < siz[0] - 1; i+=1) {
        for (let j = i + 1; j < siz[0]; j+=1) {
            if ( !(mat[j][i] === 0) ) {
                if (mat[i][i] === 0) {
                    mat = matInterchange(mat, i, j);
                    sign = -sign;
                } else {
                    let temp = mat[j][i]/mat[i][i];
                    temp = Math.abs(temp);
                    if (Math.sign(mat[j][i]) === Math.sign(mat[i][i])) {
                        temp = -temp;
                    }
                    for (let k = 0; k < siz[1]; k+=1) {
                        mat[j][k] = temp * mat[i][k] + mat[j][k];
                    }
                }
            }
        }
    }
    det = mat.reduce((prev, curr, index) => prev * curr[index], 1);
    return sign * det;
}
function matInv (mat) {
    const adjMat = matrix(mat.map((el,row,col) => {
        const sign = (-1)**(2 + row + col)
        const M = mat().filter((el1,k) => k !== row).map(el2 => el2.filter((el3,l) => l !== col))
        const rez = matDet(matrix(M)) * sign
        
        return rez
    }))
    const det = matDet(mat)
    return matrix(adjMat().map(el => el.map(el2 => el2 / det)))
}

class Circuit {
    constructor (rIni,aIni,arrJ) {
        this.A = matrix(aIni);
        this.Y = matrix(rIni.map((el,i,arr) => arr.map((el2,i2) => i2 === i? 1/el : 0)));
        this.Ay = matMult(this.A,this.Y);
        this.Ayat = matMult(this.Ay,matrix(this.A.trans()));
        this.invAyat = matInv(this.Ayat);
        this.arrJ = arrJ;
    }

    U0 (arri) {
        this.J = this.arrJ.map((el,i) => el.map(e => e*arri[i]))
        this.J = this.J.reduce((acc,el) => acc.map((e,i2) => e + el[i2]))
        this.J = this.J.map(el => [el])
        this.J = matrix(this.J)
        this.minAj = matMult(matrix(this.A.map((el) => -1*el)),this.J)
        return matMult(this.invAyat,this.minAj)
        
    }

    U (arri) {
        const rez = matMult(matrix(this.A.trans()), this.U0(arri))
        return rez
    }

    E (arri) {
        let rez = this.U(arri)()
        rez = rez.reduce((acc, el, i) => {
            return acc + el[0]**2 * this.Y(i,i)
        }, 0)
        return rez
    }

    I (arri) {
        let rez = this.U(arri)()
        rez = matrix(rez.map((el,i) => el[0] * this.Y(i,i)))
        return rez
    }
};

// c.U0 = matMult(matrix(matMult(matMult(matMult(c.A,c.Y),matrix(c.A.trans())).inv())))),matMult(matrix(c.A.mul(-1)),c.J))

exports.c = Circuit;
// var F = matrix([[1, 3, 3], [1, 4, 3], [1, 3, 4]])
// F = matrix(F.inv())
// console.log('F',F())



// c.A().forEach((el, i) => console.log('A' + i +'   ' + el));
// console.log("");
// c.Y().forEach((el, i) => console.log('Y' + i +'   ' + el));



// From maple
// Rwb := 0.00001232;
// Rwt := 0.00001388;
// Rclampv := 0.37185*10^(-5);
// Rclampg := 0.00001766;
// Rcont := 0.000016;
// Rcb := Rcont/2;
// Rct := Rcont/2;
// R1 := Rclampv + 2*Rct;
// R2 := Rclampv + 2*Rct + Rwt;
// R3 := Rclampg;
// R4 := Rclampv + 2*Rcb;
// R5 := Rclampv + 2*Rcb;
// R6 := Rwb;