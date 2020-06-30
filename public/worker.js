(function () {
	'use strict';

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var odex = createCommonjsModule(function (module, exports) {
	/**
	 * An implementation of ODEX, by E. Hairer and G. Wanner, ported from the Fortran ODEX.F.
	 * The original work carries the BSD 2-clause license, and so does this.
	 *
	 * Copyright (c) 2016 Colin Smith.
	 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
	 * disclaimer.
	 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
	 * following disclaimer in the documentation and/or other materials provided with the distribution.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
	 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
	 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
	 * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
	 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */
	Object.defineProperty(exports, '__esModule', { value: true });
	var Outcome
	;(function(Outcome) {
	  Outcome[(Outcome['Converged'] = 0)] = 'Converged';
	  Outcome[(Outcome['MaxStepsExceeded'] = 1)] = 'MaxStepsExceeded';
	  Outcome[(Outcome['EarlyReturn'] = 2)] = 'EarlyReturn';
	})((Outcome = exports.Outcome || (exports.Outcome = {})));
	var Solver = (function() {
	  function Solver(n) {
	    this.n = n;
	    this.uRound = 2.3e-16;
	    this.maxSteps = 10000;
	    this.initialStepSize = 1e-4;
	    this.maxStepSize = 0;
	    this.maxExtrapolationColumns = 9;
	    this.stepSizeSequence = 0;
	    this.stabilityCheckCount = 1;
	    this.stabilityCheckTableLines = 2;
	    this.denseOutput = false;
	    this.denseOutputErrorEstimator = true;
	    this.denseComponents = undefined;
	    this.interpolationFormulaDegree = 4;
	    this.stepSizeReductionFactor = 0.5;
	    this.stepSizeFac1 = 0.02;
	    this.stepSizeFac2 = 4.0;
	    this.stepSizeFac3 = 0.8;
	    this.stepSizeFac4 = 0.9;
	    this.stepSafetyFactor1 = 0.65;
	    this.stepSafetyFactor2 = 0.94;
	    this.relativeTolerance = 1e-5;
	    this.absoluteTolerance = 1e-5;
	    this.debug = false;
	  }
	  Solver.prototype.grid = function(dt, out) {
	    if (!this.denseOutput)
	      throw new Error('Must set .denseOutput to true when using grid')
	    var components = this.denseComponents;
	    if (!components) {
	      components = [];
	      for (var i = 0; i < this.n; ++i) components.push(i);
	    }
	    var t;
	    return function(n, xOld, x, y, interpolate) {
	      if (n === 1) {
	        var v = out(x, y);
	        t = x + dt;
	        return v
	      }
	      while (t <= x) {
	        var yf = [];
	        for (
	          var _i = 0, components_1 = components;
	          _i < components_1.length;
	          _i++
	        ) {
	          var i = components_1[_i];
	          yf.push(interpolate(i, t));
	        }
	        var v = out(t, yf);
	        if (v === false) return false
	        t += dt;
	      }
	    }
	  };
	  // Make a 1-based 2D array, with r rows and c columns. The initial values are undefined.
	  Solver.dim2 = function(r, c) {
	    var a = new Array(r + 1);
	    for (var i = 1; i <= r; ++i) a[i] = Solver.dim(c);
	    return a
	  };
	  // Generate step size sequence and return as a 1-based array of length n.
	  Solver.stepSizeSequence = function(nSeq, n) {
	    var a = new Array(n + 1);
	    a[0] = 0;
	    switch (nSeq) {
	      case 1:
	        for (var i = 1; i <= n; ++i) a[i] = 2 * i;
	        break
	      case 2:
	        a[1] = 2;
	        for (var i = 2; i <= n; ++i) a[i] = 4 * i - 4;
	        break
	      case 3:
	        a[1] = 2;
	        a[2] = 4;
	        a[3] = 6;
	        for (var i = 4; i <= n; ++i) a[i] = 2 * a[i - 2];
	        break
	      case 4:
	        for (var i = 1; i <= n; ++i) a[i] = 4 * i - 2;
	        break
	      case 5:
	        for (var i = 1; i <= n; ++i) a[i] = 4 * i;
	        break
	      default:
	        throw new Error('invalid stepSizeSequence selected')
	    }
	    return a
	  };
	  // Integrate the differential system represented by f, from x to xEnd, with initial data y.
	  // solOut, if provided, is called at each integration step.
	  Solver.prototype.solve = function(f, x, y0, xEnd, solOut) {
	    var _this = this;
	    // Make a copy of y0, 1-based. We leave the user's parameters alone so that they may be reused if desired.
	    var y = [0].concat(y0);
	    var dz = Solver.dim(this.n);
	    var yh1 = Solver.dim(this.n);
	    var yh2 = Solver.dim(this.n);
	    if (this.maxSteps <= 0) throw new Error('maxSteps must be positive')
	    var km = this.maxExtrapolationColumns;
	    if (km <= 2) throw new Error('maxExtrapolationColumns must be > 2')
	    var nSeq = this.stepSizeSequence || (this.denseOutput ? 4 : 1);
	    if (nSeq <= 3 && this.denseOutput)
	      throw new Error('stepSizeSequence incompatible with denseOutput')
	    if (this.denseOutput && !solOut)
	      throw new Error('denseOutput requires a solution observer function')
	    if (
	      this.interpolationFormulaDegree <= 0 ||
	      this.interpolationFormulaDegree >= 7
	    )
	      throw new Error('bad interpolationFormulaDegree')
	    var icom = [0]; // icom will be 1-based, so start with a pad entry.
	    var nrdens = 0;
	    if (this.denseOutput) {
	      if (this.denseComponents) {
	        for (var _i = 0, _a = this.denseComponents; _i < _a.length; _i++) {
	          var c = _a[_i];
	          // convert dense components requested into one-based indexing.
	          if (c < 0 || c > this.n) throw new Error('bad dense component: ' + c)
	          icom.push(c + 1);
	          ++nrdens;
	        }
	      } else {
	        // if user asked for dense output but did not specify any denseComponents,
	        // request all of them.
	        for (var i = 1; i <= this.n; ++i) {
	          icom.push(i);
	        }
	        nrdens = this.n;
	      }
	    }
	    if (this.uRound <= 1e-35 || this.uRound > 1)
	      throw new Error('suspicious value of uRound')
	    var hMax = Math.abs(this.maxStepSize || xEnd - x);
	    var lfSafe = 2 * km * km + km;
	    function expandToArray(x, n) {
	      // If x is an array, return a 1-based copy of it. If x is a number, return a new 1-based array
	      // consisting of n copies of the number.
	      var tolArray = [0];
	      if (Array.isArray(x)) {
	        return tolArray.concat(x)
	      } else {
	        for (var i = 0; i < n; ++i) tolArray.push(x);
	        return tolArray
	      }
	    }
	    var aTol = expandToArray(this.absoluteTolerance, this.n);
	    var rTol = expandToArray(this.relativeTolerance, this.n);
	    var _b = [0, 0, 0, 0],
	      nEval = _b[0],
	      nStep = _b[1],
	      nAccept = _b[2],
	      nReject = _b[3];
	    // call to core integrator
	    var nrd = Math.max(1, nrdens);
	    var ncom = Math.max(1, (2 * km + 5) * nrdens);
	    var dens = Solver.dim(ncom);
	    var fSafe = Solver.dim2(lfSafe, nrd);
	    // Wrap f in a function F which hides the one-based indexing from the customers.
	    var F = function(x, y, yp) {
	      var ret = f(x, y.slice(1));
	      for (var i = 0; i < ret.length; ++i) yp[i + 1] = ret[i];
	    };
	    var odxcor = function() {
	      // The following three variables are COMMON/CONTEX/
	      var xOldd;
	      var hhh;
	      var kmit;
	      var acceptStep = function(n) {
	        // Returns true if we should continue the integration. The only time false
	        // is returned is when the user's solution observation function has returned false,
	        // indicating that she does not wish to continue the computation.
	        xOld = x;
	        x += h;
	        if (_this.denseOutput) {
	          // kmit = mu of the paper
	          kmit = 2 * kc - _this.interpolationFormulaDegree + 1;
	          for (var i = 1; i <= nrd; ++i) dens[i] = y[icom[i]];
	          xOldd = xOld;
	          hhh = h; // note: xOldd and hhh are part of /CONODX/
	          for (var i = 1; i <= nrd; ++i) dens[nrd + i] = h * dz[icom[i]];
	          var kln = 2 * nrd;
	          for (var i = 1; i <= nrd; ++i) dens[kln + i] = t[1][icom[i]];
	          // compute solution at mid-point
	          for (var j = 2; j <= kc; ++j) {
	            var dblenj = nj[j];
	            for (var l = j; l >= 2; --l) {
	              var factor = Math.pow(dblenj / nj[l - 1], 2) - 1;
	              for (var i = 1; i <= nrd; ++i) {
	                ySafe[l - 1][i] =
	                  ySafe[l][i] + (ySafe[l][i] - ySafe[l - 1][i]) / factor;
	              }
	            }
	          }
	          var krn = 4 * nrd;
	          for (var i = 1; i <= nrd; ++i) dens[krn + i] = ySafe[1][i];
	          // compute first derivative at right end
	          for (var i = 1; i <= n; ++i) yh1[i] = t[1][i];
	          F(x, yh1, yh2);
	          krn = 3 * nrd;
	          for (var i = 1; i <= nrd; ++i) dens[krn + i] = yh2[icom[i]] * h;
	          // THE LOOP
	          for (var kmi = 1; kmi <= kmit; ++kmi) {
	            // compute kmi-th derivative at mid-point
	            var kbeg = ((kmi + 1) / 2) | 0;
	            for (var kk = kbeg; kk <= kc; ++kk) {
	              var facnj = Math.pow(nj[kk] / 2, kmi - 1);
	              iPt = iPoint[kk + 1] - 2 * kk + kmi;
	              for (var i = 1; i <= nrd; ++i) {
	                ySafe[kk][i] = fSafe[iPt][i] * facnj;
	              }
	            }
	            for (var j = kbeg + 1; j <= kc; ++j) {
	              var dblenj = nj[j];
	              for (var l = j; l >= kbeg + 1; --l) {
	                var factor = Math.pow(dblenj / nj[l - 1], 2) - 1;
	                for (var i = 1; i <= nrd; ++i) {
	                  ySafe[l - 1][i] =
	                    ySafe[l][i] + (ySafe[l][i] - ySafe[l - 1][i]) / factor;
	                }
	              }
	            }
	            krn = (kmi + 4) * nrd;
	            for (var i = 1; i <= nrd; ++i) dens[krn + i] = ySafe[kbeg][i] * h;
	            if (kmi === kmit) continue
	            // compute differences
	            for (var kk = ((kmi + 2) / 2) | 0; kk <= kc; ++kk) {
	              var lbeg = iPoint[kk + 1];
	              var lend = iPoint[kk] + kmi + 1;
	              if (kmi === 1 && nSeq === 4) lend += 2;
	              var l = void 0;
	              for (l = lbeg; l >= lend; l -= 2) {
	                for (var i = 1; i <= nrd; ++i) {
	                  fSafe[l][i] -= fSafe[l - 2][i];
	                }
	              }
	              if (kmi === 1 && nSeq === 4) {
	                l = lend - 2;
	                for (var i = 1; i <= nrd; ++i) fSafe[l][i] -= dz[icom[i]];
	              }
	            }
	            // compute differences
	            for (var kk = ((kmi + 2) / 2) | 0; kk <= kc; ++kk) {
	              var lbeg = iPoint[kk + 1] - 1;
	              var lend = iPoint[kk] + kmi + 2;
	              for (var l = lbeg; l >= lend; l -= 2) {
	                for (var i = 1; i <= nrd; ++i) {
	                  fSafe[l][i] -= fSafe[l - 2][i];
	                }
	              }
	            }
	          }
	          interp(nrd, dens, kmit);
	          // estimation of interpolation error
	          if (_this.denseOutputErrorEstimator && kmit >= 1) {
	            var errint = 0;
	            for (var i = 1; i <= nrd; ++i)
	              errint += Math.pow(dens[(kmit + 4) * nrd + i] / scal[icom[i]], 2);
	            errint = Math.sqrt(errint / nrd) * errfac[kmit];
	            hoptde = h / Math.max(Math.pow(errint, 1 / (kmit + 4)), 0.01);
	            if (errint > 10) {
	              h = hoptde;
	              x = xOld;
	              ++nReject;
	              reject = true;
	              return true
	            }
	          }
	          for (var i = 1; i <= n; ++i) dz[i] = yh2[i];
	        }
	        for (var i = 1; i <= n; ++i) y[i] = t[1][i];
	        ++nAccept;
	        if (solOut) {
	          // If denseOutput, we also want to supply the dense closure.
	          if (
	            solOut(
	              nAccept + 1,
	              xOld,
	              x,
	              y.slice(1),
	              _this.denseOutput && contex(xOldd, hhh, kmit, dens, icom)
	            ) === false
	          )
	            return false
	        }
	        // compute optimal order
	        var kopt;
	        if (kc === 2) {
	          kopt = Math.min(3, km - 1);
	          if (reject) kopt = 2;
	        } else {
	          if (kc <= k) {
	            kopt = kc;
	            if (w[kc - 1] < w[kc] * _this.stepSizeFac3) kopt = kc - 1;
	            if (w[kc] < w[kc - 1] * _this.stepSizeFac4)
	              kopt = Math.min(kc + 1, km - 1);
	          } else {
	            kopt = kc - 1;
	            if (kc > 3 && w[kc - 2] < w[kc - 1] * _this.stepSizeFac3)
	              kopt = kc - 2;
	            if (w[kc] < w[kopt] * _this.stepSizeFac4)
	              kopt = Math.min(kc, km - 1);
	          }
	        }
	        // after a rejected step
	        if (reject) {
	          k = Math.min(kopt, kc);
	          h = posneg * Math.min(Math.abs(h), Math.abs(hh[k]));
	          reject = false;
	          return true // goto 10
	        }
	        if (kopt <= kc) {
	          h = hh[kopt];
	        } else {
	          if (kc < k && w[kc] < w[kc - 1] * _this.stepSizeFac4) {
	            h = (hh[kc] * a[kopt + 1]) / a[kc];
	          } else {
	            h = (hh[kc] * a[kopt]) / a[kc];
	          }
	        }
	        // compute stepsize for next step
	        k = kopt;
	        h = posneg * Math.abs(h);
	        return true
	      };
	      var midex = function(j) {
	        var dy = Solver.dim(_this.n);
	        // Computes the jth line of the extrapolation table and
	        // provides an estimation of the optional stepsize
	        var hj = h / nj[j];
	        // Euler starting step
	        for (var i = 1; i <= _this.n; ++i) {
	          yh1[i] = y[i];
	          yh2[i] = y[i] + hj * dz[i];
	        }
	        // Explicit midpoint rule
	        var m = nj[j] - 1;
	        var njMid = (nj[j] / 2) | 0;
	        for (var mm = 1; mm <= m; ++mm) {
	          if (_this.denseOutput && mm === njMid) {
	            for (var i = 1; i <= nrd; ++i) {
	              ySafe[j][i] = yh2[icom[i]];
	            }
	          }
	          F(x + hj * mm, yh2, dy);
	          if (_this.denseOutput && Math.abs(mm - njMid) <= 2 * j - 1) {
	            ++iPt;
	            for (var i = 1; i <= nrd; ++i) {
	              fSafe[iPt][i] = dy[icom[i]];
	            }
	          }
	          for (var i = 1; i <= _this.n; ++i) {
	            var ys = yh1[i];
	            yh1[i] = yh2[i];
	            yh2[i] = ys + 2 * hj * dy[i];
	          }
	          if (
	            mm <= _this.stabilityCheckCount &&
	            j <= _this.stabilityCheckTableLines
	          ) {
	            // stability check
	            var del1 = 0;
	            for (var i = 1; i <= _this.n; ++i) {
	              del1 += Math.pow(dz[i] / scal[i], 2);
	            }
	            var del2 = 0;
	            for (var i = 1; i <= _this.n; ++i) {
	              del2 += Math.pow((dy[i] - dz[i]) / scal[i], 2);
	            }
	            var quot = del2 / Math.max(_this.uRound, del1);
	            if (quot > 4) {
	              ++nEval;
	              atov = true;
	              h *= _this.stepSizeReductionFactor;
	              reject = true;
	              return
	            }
	          }
	        }
	        // final smoothing step
	        F(x + h, yh2, dy);
	        if (_this.denseOutput && njMid <= 2 * j - 1) {
	          ++iPt;
	          for (var i = 1; i <= nrd; ++i) {
	            fSafe[iPt][i] = dy[icom[i]];
	          }
	        }
	        for (var i = 1; i <= _this.n; ++i) {
	          t[j][i] = (yh1[i] + yh2[i] + hj * dy[i]) / 2;
	        }
	        nEval += nj[j];
	        // polynomial extrapolation
	        if (j === 1) return // was j.eq.1
	        var dblenj = nj[j];
	        var fac;
	        for (var l = j; l > 1; --l) {
	          fac = Math.pow(dblenj / nj[l - 1], 2) - 1;
	          for (var i = 1; i <= _this.n; ++i) {
	            t[l - 1][i] = t[l][i] + (t[l][i] - t[l - 1][i]) / fac;
	          }
	        }
	        err = 0;
	        // scaling
	        for (var i = 1; i <= _this.n; ++i) {
	          var t1i = Math.max(Math.abs(y[i]), Math.abs(t[1][i]));
	          scal[i] = aTol[i] + rTol[i] * t1i;
	          err += Math.pow((t[1][i] - t[2][i]) / scal[i], 2);
	        }
	        err = Math.sqrt(err / _this.n);
	        if (err * _this.uRound >= 1 || (j > 2 && err >= errOld)) {
	          atov = true;
	          h *= _this.stepSizeReductionFactor;
	          reject = true;
	          return
	        }
	        errOld = Math.max(4 * err, 1);
	        // compute optimal stepsizes
	        var exp0 = 1 / (2 * j - 1);
	        var facMin = Math.pow(_this.stepSizeFac1, exp0);
	        fac = Math.min(
	          _this.stepSizeFac2 / facMin,
	          Math.max(
	            facMin,
	            Math.pow(err / _this.stepSafetyFactor1, exp0) /
	              _this.stepSafetyFactor2
	          )
	        );
	        fac = 1 / fac;
	        hh[j] = Math.min(Math.abs(h) * fac, hMax);
	        w[j] = a[j] / hh[j];
	      };
	      var interp = function(n, y, imit) {
	        // computes the coefficients of the interpolation formula
	        var a = new Array(31); // zero-based: 0:30
	        // begin with Hermite interpolation
	        for (var i = 1; i <= n; ++i) {
	          var y0_1 = y[i];
	          var y1 = y[2 * n + i];
	          var yp0 = y[n + i];
	          var yp1 = y[3 * n + i];
	          var yDiff = y1 - y0_1;
	          var aspl = -yp1 + yDiff;
	          var bspl = yp0 - yDiff;
	          y[n + i] = yDiff;
	          y[2 * n + i] = aspl;
	          y[3 * n + i] = bspl;
	          if (imit < 0) continue
	          // compute the derivatives of Hermite at midpoint
	          var ph0 = (y0_1 + y1) * 0.5 + 0.125 * (aspl + bspl);
	          var ph1 = yDiff + (aspl - bspl) * 0.25;
	          var ph2 = -(yp0 - yp1);
	          var ph3 = 6 * (bspl - aspl);
	          // compute the further coefficients
	          if (imit >= 1) {
	            a[1] = 16 * (y[5 * n + i] - ph1);
	            if (imit >= 3) {
	              a[3] = 16 * (y[7 * n + i] - ph3 + 3 * a[1]);
	              if (imit >= 5) {
	                for (var im = 5; im <= imit; im += 2) {
	                  var fac1 = (im * (im - 1)) / 2;
	                  var fac2 = fac1 * (im - 2) * (im - 3) * 2;
	                  a[im] =
	                    16 *
	                    (y[(im + 4) * n + i] + fac1 * a[im - 2] - fac2 * a[im - 4]);
	                }
	              }
	            }
	          }
	          a[0] = (y[4 * n + i] - ph0) * 16;
	          if (imit >= 2) {
	            a[2] = (y[n * 6 + i] - ph2 + a[0]) * 16;
	            if (imit >= 4) {
	              for (var im = 4; im <= imit; im += 2) {
	                var fac1 = (im * (im - 1)) / 2;
	                var fac2 = im * (im - 1) * (im - 2) * (im - 3);
	                a[im] =
	                  (y[n * (im + 4) + i] + a[im - 2] * fac1 - a[im - 4] * fac2) *
	                  16;
	              }
	            }
	          }
	          for (var im = 0; im <= imit; ++im) y[n * (im + 4) + i] = a[im];
	        }
	      };
	      var contex = function(xOld, h, imit, y, icom) {
	        return function(c, x) {
	          var i = 0;
	          for (var j = 1; j <= nrd; ++j) {
	            // careful: customers describe components 0-based. We record indices 1-based.
	            if (icom[j] === c + 1) i = j;
	          }
	          if (i === 0)
	            throw new Error('no dense output available for component ' + c)
	          var theta = (x - xOld) / h;
	          var theta1 = 1 - theta;
	          var phthet =
	            y[i] +
	            theta *
	              (y[nrd + i] +
	                theta1 * (y[2 * nrd + i] * theta + y[3 * nrd + i] * theta1));
	          if (imit < 0) return phthet
	          var thetah = theta - 0.5;
	          var ret = y[nrd * (imit + 4) + i];
	          for (var im = imit; im >= 1; --im) {
	            ret = y[nrd * (im + 3) + i] + (ret * thetah) / im;
	          }
	          return phthet + Math.pow(theta * theta1, 2) * ret
	        }
	      };
	      // preparation
	      var ySafe = Solver.dim2(km, nrd);
	      var hh = Solver.dim(km);
	      var t = Solver.dim2(km, _this.n);
	      // Define the step size sequence
	      var nj = Solver.stepSizeSequence(nSeq, km);
	      // Define the a[i] for order selection
	      var a = Solver.dim(km);
	      a[1] = 1 + nj[1];
	      for (var i = 2; i <= km; ++i) {
	        a[i] = a[i - 1] + nj[i];
	      }
	      // Initial Scaling
	      var scal = Solver.dim(_this.n);
	      for (var i = 1; i <= _this.n; ++i) {
	        scal[i] = aTol[i] + rTol[i] + Math.abs(y[i]);
	      }
	      // Initial preparations
	      var posneg = xEnd - x >= 0 ? 1 : -1;
	      var k = Math.max(
	        2,
	        Math.min(km - 1, Math.floor(-Solver.log10(rTol[1] + 1e-40) * 0.6 + 1.5))
	      );
	      var h = Math.max(Math.abs(_this.initialStepSize), 1e-4);
	      h = posneg * Math.min(h, hMax, Math.abs(xEnd - x) / 2);
	      var iPoint = Solver.dim(km + 1);
	      var errfac = Solver.dim(2 * km);
	      var xOld = x;
	      var iPt = 0;
	      if (solOut) {
	        if (_this.denseOutput) {
	          iPoint[1] = 0;
	          for (var i = 1; i <= km; ++i) {
	            var njAdd = 4 * i - 2;
	            if (nj[i] > njAdd) ++njAdd;
	            iPoint[i + 1] = iPoint[i] + njAdd;
	          }
	          for (var mu = 1; mu <= 2 * km; ++mu) {
	            var errx = Math.sqrt(mu / (mu + 4)) * 0.5;
	            var prod = Math.pow(1 / (mu + 4), 2);
	            for (var j = 1; j <= mu; ++j) prod *= errx / j;
	            errfac[mu] = prod;
	          }
	          iPt = 0;
	        }
	        // check return value and abandon integration if called for
	        if (false === solOut(nAccept + 1, xOld, x, y.slice(1))) {
	          return Outcome.EarlyReturn
	        }
	      }
	      var err = 0;
	      var errOld = 1e10;
	      var hoptde = posneg * hMax;
	      var w = Solver.dim(km);
	      w[1] = 0;
	      var reject = false;
	      var last = false;
	      var atov;
	      var kc = 0;
	      var STATE
	      ;(function(STATE) {
	        STATE[(STATE['Start'] = 0)] = 'Start';
	        STATE[(STATE['BasicIntegrationStep'] = 1)] = 'BasicIntegrationStep';
	        STATE[(STATE['ConvergenceStep'] = 2)] = 'ConvergenceStep';
	        STATE[(STATE['HopeForConvergence'] = 3)] = 'HopeForConvergence';
	        STATE[(STATE['Accept'] = 4)] = 'Accept';
	        STATE[(STATE['Reject'] = 5)] = 'Reject';
	      })(STATE || (STATE = {}));
	      var state = STATE.Start;
	      loop: while (true) {
	        _this.debug &&
	          console.log('STATE', STATE[state], nStep, xOld, x, h, k, kc, hoptde);
	        switch (state) {
	          case STATE.Start:
	            atov = false;
	            // Is xEnd reached in the next step?
	            if (0.1 * Math.abs(xEnd - x) <= Math.abs(x) * _this.uRound)
	              break loop
	            h =
	              posneg *
	              Math.min(Math.abs(h), Math.abs(xEnd - x), hMax, Math.abs(hoptde));
	            if ((x + 1.01 * h - xEnd) * posneg > 0) {
	              h = xEnd - x;
	              last = true;
	            }
	            if (nStep === 0 || !_this.denseOutput) {
	              F(x, y, dz);
	              ++nEval;
	            }
	            // The first and last step
	            if (nStep === 0 || last) {
	              iPt = 0;
	              ++nStep;
	              for (var j = 1; j <= k; ++j) {
	                kc = j;
	                midex(j);
	                if (atov) continue loop
	                if (j > 1 && err <= 1) {
	                  state = STATE.Accept;
	                  continue loop
	                }
	              }
	              state = STATE.HopeForConvergence;
	              continue
	            }
	            state = STATE.BasicIntegrationStep;
	            continue
	          case STATE.BasicIntegrationStep:
	            // basic integration step
	            iPt = 0;
	            ++nStep;
	            if (nStep >= _this.maxSteps) {
	              return Outcome.MaxStepsExceeded
	            }
	            kc = k - 1;
	            for (var j = 1; j <= kc; ++j) {
	              midex(j);
	              if (atov) {
	                state = STATE.Start;
	                continue loop
	              }
	            }
	            // convergence monitor
	            if (k === 2 || reject) {
	              state = STATE.ConvergenceStep;
	            } else {
	              if (err <= 1) {
	                state = STATE.Accept;
	              } else if (err > Math.pow((nj[k + 1] * nj[k]) / 4, 2)) {
	                state = STATE.Reject;
	              } else state = STATE.ConvergenceStep;
	            }
	            continue
	          case STATE.ConvergenceStep:
	            midex(k);
	            if (atov) {
	              state = STATE.Start;
	              continue
	            }
	            kc = k;
	            if (err <= 1) {
	              state = STATE.Accept;
	              continue
	            }
	            state = STATE.HopeForConvergence;
	            continue
	          case STATE.HopeForConvergence:
	            // hope for convergence in line k + 1
	            if (err > Math.pow(nj[k + 1] / 2, 2)) {
	              state = STATE.Reject;
	              continue
	            }
	            kc = k + 1;
	            midex(kc);
	            if (atov) state = STATE.Start;
	            else if (err > 1) state = STATE.Reject;
	            else state = STATE.Accept;
	            continue
	          case STATE.Accept:
	            if (!acceptStep(_this.n)) return Outcome.EarlyReturn
	            state = STATE.Start;
	            continue
	          case STATE.Reject:
	            k = Math.min(k, kc, km - 1);
	            if (k > 2 && w[k - 1] < w[k] * _this.stepSizeFac3) k -= 1;
	            ++nReject;
	            h = posneg * hh[k];
	            reject = true;
	            state = STATE.BasicIntegrationStep;
	        }
	      }
	      return Outcome.Converged
	    };
	    var outcome = odxcor();
	    return {
	      y: y.slice(1),
	      outcome: outcome,
	      nStep: nStep,
	      xEnd: xEnd,
	      nAccept: nAccept,
	      nReject: nReject,
	      nEval: nEval,
	    }
	  };
	  return Solver
	})();
	// return a 1-based array of length n. Initial values undefined.
	Solver.dim = function(n) {
	  return Array(n + 1)
	};
	Solver.log10 = function(x) {
	  return Math.log(x) / Math.LN10
	};
	exports.Solver = Solver;

	});

	var odex$1 = unwrapExports(odex);
	var odex_1 = odex.Outcome;
	var odex_2 = odex.Solver;

	const convection = function convection (
	  v = 10,
	  t = 293.15,
	  d = 0.05,
	  p = 101325
	) {
	  let Vwind = v;
	  let Dcyl = d;
	  let Tair = t;
	  let pA = p;
	  function kAir (T) {
	    if (T > 1000) {
	      return kAir(1000)
	    }
	    if (T < 70) {
	      return kAir(70)
	    }
	    return (
	      -8.404165e-4 +
	      1.107418e-4 * T -
	      8.635537e-8 * T ** 2 +
	      6.31411e-11 * T ** 3 -
	      1.88168e-14 * T ** 4
	    )
	  }
	  function cpAir (T) {
	    if (T < 100) {
	      return cpAir(100)
	    }
	    if (T < 375) {
	      return (
	        1010.97 +
	        0.0439479 * T ** 1 -
	        2.922398e-4 * T ** 2 +
	        6.503467e-7 * T ** 3
	      )
	    }
	    if (T < 1300) {
	      return (
	        1093.29 -
	        0.6355521 * T ** 1 +
	        0.001633992 * T ** 2 -
	        1.412935e-6 * T ** 3 +
	        5.59492e-10 * T ** 4 -
	        8.663072e-14 * T ** 5
	      )
	    }
	    if (T <= 3000) {
	      return (
	        701.0807 +
	        0.8493867 * T ** 1 -
	        5.846487e-4 * T ** 2 +
	        2.302436e-7 * T ** 3 -
	        4.846758e-11 * T ** 4 +
	        4.23502e-15 * T ** 5
	      )
	    }
	    return cpAir(3000)
	  }
	  function rhoAir (press, T) {
	    if (T <= 80) {
	      return 352.716 * 80 ** -1
	    }
	    if (T <= 3000) {
	      return 352.716 * T ** -1
	    }
	    return 352.716 * 3000 ** -1
	  }
	  function etaAir (T) {
	    if (T < 120) {
	      return etaAir(120)
	    }
	    if (T < 600) {
	      return (
	        -1.132275e-7 +
	        7.94333e-8 * T ** 1 -
	        7.197989e-11 * T ** 2 +
	        5.158693e-14 * T ** 3 -
	        1.592472e-17 * T ** 4
	      )
	    }
	    if (T <= 2150) {
	      return (
	        3.892629e-6 +
	        5.75387e-8 * T ** 1 -
	        2.675811e-11 * T ** 2 +
	        9.709691e-15 * T ** 3 -
	        1.355541e-18 * T ** 4
	      )
	    }
	    return etaAir(2150)
	  }
	  function Re (Tinp) {
	    return (rhoAir(pA, Tinp) * Vwind * Dcyl) / etaAir(Tinp)
	  }
	  function Pr (Tinp) {
	    return (etaAir(Tinp) * cpAir(Tinp)) / kAir(Tinp)
	  }
	  function hConvFunc (Tinp, v1, t1, d1, p1) {
	    if (v1 !== undefined) {
	      Vwind = v1;
	    }
	    if (d1 !== undefined) {
	      Dcyl = d1;
	    }
	    if (t1 !== undefined) {
	      Tair = t1;
	    }
	    if (p1 !== undefined) {
	      pA = p1;
	    }
	    const Tfilm = (Tinp + Tair) / 2;
	    const Hc =
	      (kAir(Tfilm) *
	        (0.3 +
	          (0.62 *
	            Math.sqrt(Re(Tfilm)) *
	            Pr(Tfilm) ** (1 / 3) *
	            (1 + 0.0003922783206 * Re(Tfilm) ** 0.625) ** 0.8) /
	            (1 + 0.5428835233 * (1 / Pr(Tfilm)) ** (2 / 3)) ** 0.25)) /
	      Dcyl;
	    return Hc
	  }

	  const hConvObj = {
	    setCondition: function setCondition (
	      v1 = Vwind,
	      t1 = Tair,
	      d1 = Dcyl,
	      p1 = pA
	    ) {
	      Vwind = v1;
	      Dcyl = d1;
	      Tair = t1;
	      pA = p1;
	    },
	  };
	  return Object.assign(hConvFunc, hConvObj)
	};

	function convectionObj (obj) {
	  const Tair = obj.Tair.unit === 'К' ? obj.Tair.value : obj.Tair.value + 273.15;
	  return convection(obj.Vwind.value, Tair, obj.Dcyl.value)
	}

	/**
	 * Constructs an object storing rational numbers and methods performing operations
	 * 
	 * @param num numerator of the rational number
	 * @param den denomenator of the rational number
	 * @returns Object storing the rational number and method doing arthmetic operations
	 */
	function rational(num, den) {
	  den = den || 1;
	  if (Math.sign(den) === -1) {
	    num = -num;
	    den = -den;
	  }
	  return {
	    num: num,
	    den: den,
	    add: (op) => rational(num * op.den + den * op.num, den * op.den),
	    sub: (op) => rational(num * op.den - den * op.num, den * op.den),
	    mul: (op) => multiply(op, num, den),
	    div: (op) => {
	      let _num = op.den;
	      let _den = op.num;
	      return multiply(rational(_num, _den), num, den);
	    }
	  }
	}

	var rational_1 = rational;

	/**
	 * Multiplies two rational number based on multiplication rules that cancels common terms
	 * 
	 * @param op the second operand
	 * @param num numerator of first operand
	 * @param den denominator of second operand
	 * @returns another rational number
	 */
	function multiply(op, num, den) {
	  let _num = Math.sign(num) * Math.sign(op.num);
	  let _den = Math.sign(den) * Math.sign(op.den);
	  if (Math.abs(num) === Math.abs(op.den) && Math.abs(den) === Math.abs(op.num)) {
	    _num = _num;
	    _den = _den;
	  } else if (Math.abs(den) === Math.abs(op.num)) {
	    _num = _num * Math.abs(num);
	    _den = _den * Math.abs(op.den);
	  } else if (Math.abs(num) === Math.abs(op.den)) {
	    _num = _num * Math.abs(op.num);
	    _den = _den * Math.abs(den);
	  } else {
	    _num = num * op.num;
	    _den = den * op.den;
	  }
	  return rational(_num, _den);
	}

	/**
	 * Merges two matrices in all directions
	 * 
	 * @param {Array} base Base matrix on which merge is performed
	 */
	function merge(base) {
	    return {
	        top: (mergeData) => top(base, mergeData),
	        bottom: (mergeData) => bottom(base, mergeData),
	        left: (mergeData) => left(base, mergeData),
	        right: (mergeData) => right(base, mergeData)
	    }
	}

	var merge_1 = merge;

	/**
	 * Merges the base matrix with the incoming matrix in the top direction
	 * @param {Array} base 
	 * @param {Array} mergeData incoming matrix
	 */
	function top(base, mergeData) {
	    let baseWidth = base[0].length || base.length;
	    let mergeDataWidth = mergeData[mergeData.length - 1].length || mergeData.length;

	    if (baseWidth !== mergeDataWidth) {
	        return base;
	    }

	    if (!Array.isArray(base[0])) {
	        base = [base];
	    }

	    if (!Array.isArray(mergeData[mergeData.length - 1])) {
	        mergeData = [mergeData];
	    }

	    for (let row = mergeData.length - 1; row >= 0; row--) {
	        base.unshift(mergeData[row].map((ele) => ele));
	    }
	    return base;
	}

	/**
	 * Merges the base matrix with the incoming matrix in the bottom direction
	 * @param {Array} base 
	 * @param {Array} mergeData incoming matrix
	 */
	function bottom(base, mergeData) {
	    let baseWidth = base[base.length - 1].length || base.length;
	    let mergeDataWidth = mergeData[0].length || mergeData.length;
	    if (baseWidth !== mergeDataWidth) {
	        return base;
	    }

	    if (!Array.isArray(base[base.length - 1])) {
	        base = [base];
	    }

	    if (!Array.isArray(mergeData[0])) {
	        mergeData = [mergeData];
	    }


	    for (let row = 0; row < mergeData.length; row++) {
	        base.push(mergeData[row].map((ele) => ele));
	    }
	    return base;
	}

	/**
	 * Merges the base matrix with the incoming matrix in the left direction
	 * @param {Array} base 
	 * @param {Array} mergeData incoming matrix
	 */
	function left(base, mergeData) {
	    let baseHeight = base.length;
	    let mergeDataHeight = mergeData.length;
	    if (!Array.isArray(base[0]) && !Array.isArray(mergeData[0])) {
	        base.unshift.apply(base, mergeData);
	        return base;
	    }

	    if (baseHeight !== mergeDataHeight) {
	        return base;
	    }

	    for (let row = 0; row < baseHeight; row++) {
	        base[row].unshift.apply(base[row], mergeData[row].map((ele) => ele));
	    }
	    return base;
	}

	/**
	 * Merges the base matrix with the incoming matrix in the right direction
	 * @param {Array} base 
	 * @param {Array} mergeData incoming matrix
	 */
	function right(base, mergeData) {
	    let baseHeight = base.length;
	    let mergeDataHeight = mergeData.length;
	    if (!Array.isArray(base[0]) && !Array.isArray(mergeData[0])) {
	        base.push.apply(base, mergeData);
	        return base;
	    }

	    if (baseHeight !== mergeDataHeight) {
	        return base;
	    }

	    for (let row = 0; row < baseHeight; row++) {
	        base[row].push.apply(base[row], mergeData[row].map((ele) => ele));
	    }
	    return base;
	}

	/**
	 * Pass a 2-dimensional array that will return a function accepting indices to access the matrix
	 *
	 * @param mat array that initializes the matrix
	 * @returns function with the array initialized and access to method that perform operations on the matrix
	 */
	function matrix(mat) {
	    if (!Array.isArray(mat)) {
	        throw new Error('Input should be of type array');
	    }
	    let _matrix = function() {
	        let args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
	        return read(mat, args);
	    };
	    return Object.assign(_matrix, _mat(mat));
	}


	/**
	 * Private function that returns an object containing methods
	 * that perform operations on the matrix
	 *
	 * @param mat array that initializes the matrix
	 * @returns object of methods performing matrix operations
	 */
	function _mat(mat) {
	    return {
	        size: () => size(mat),
	        add: (operand) => operate(mat, operand, addition),
	        sub: (operand) => operate(mat, operand, subtraction),
	        mul: (operand) => operate(mat, operand, multiplication),
	        div: (operand) => operate(mat, operand, division),
	        prod: (operand) => prod(mat, operand),
	        trans: () => trans(mat),
	        set: function() {
	            let args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
	            return {
	                to: (val) => replace(mat, val, args)
	            }
	        },
	        det: () => determinant(mat),
	        inv: () => invert(mat),
	        merge: merge_1(mat),
	        map: (func) => map(mat, func)
	    };
	}

	var lib = matrix;


	/**
	 * Calculates the size of the array across each dimension
	 *
	 * @param mat input matrix that initialized the function
	 * @returns size of the matrix as an array
	 */
	function size(mat) {
	    let s = [];
	    while (Array.isArray(mat)) {
	        s.push(mat.length);
	        mat = mat[0];
	    }
	    return s;
	}


	/**
	 * Private function to calculate the dimensions of the matrix
	 *
	 * @param mat input matrix that initializes the function
	 * @returns integer indicating the number of dimensions
	 */
	function dimensions(mat) {
	    return size(mat).length;
	}


	/**
	 * Outputs the original matrix or a particular element or a matrix that is part of the original
	 *
	 * @param mat input matrix that initializes the function
	 * @param args indices to access one or more array elements
	 * @returns array or single element
	 */
	function read(mat, args) {
	    if (args.length === 0) {
	        return mat;
	    } else {
	        return extract(mat, args);
	    }
	}


	/**
	 * Private function to extract a single element or a matrix that is part of the original
	 *
	 * @param mat input matrix that initializes the function
	 * @param args indices to access one or more array elements
	 * @returns array or single element
	 */
	function extract(mat, args) {
	    let dim = dimensions(mat);
	    for (let i = 0; i < dim; i++) {
	        let d = args[i];
	        if (d === undefined) {
	            break;
	        }
	        if (Array.isArray(d)) {
	            // if an element of args is an array, more extraction is needed
	            mat = extractRange(mat, d, i);
	        } else if (Number.isInteger(d)) {
	            if (dimensions(mat) > 1 && i > 0) {
	                mat = mat.map(function(elem) {
	                    return [elem[d]];
	                });
	            } else {
	                mat = mat[d];
	            }
	        }
	    }
	    return mat;
	}


	/**
	 * Private function to extract a portion of the array based on the specified range
	 *
	 * @param mat input matrix that initialized the function
	 * @param arg single argument containing the range specified as an array
	 * @param ind the current index of the arguments while extracting the matrix
	 * @returns array from the specified range
	 */
	function extractRange(mat, arg, ind) {
	    if (!arg.length) {
	        return mat;
	    } else if (arg.length === 2) {
	        let reverse = arg[0] > arg[1];
	        let first = (!reverse) ? arg[0] : arg[1];
	        let last = (!reverse) ? arg[1]: arg[0];
	        if (dimensions(mat) > 1 && ind > 0) {
	            return mat.map(function(elem) {
	                if (reverse) {
	                    return elem.slice(first, last+1).reverse();
	                }
	                return elem.slice(first, last+1);
	            })
	        } else {
	            mat = mat.slice(first, last+1);
	            return (reverse && mat.reverse()) || mat;
	        }
	    }
	}


	/**
	 * Replaces the specified index in the matrix with the specified value
	 *
	 * @param mat input matrix that initialized the function
	 * @param value specified value that replace current value at index or indices
	 * @param args index or indices passed in arguments to initialized function
	 * @returns replaced matrix
	 */
	function replace(mat, value, args) { //TODO: Clean this function up
	    let result = clone(mat);
	    let prev = args[0];
	    let start = prev[0] || 0;
	    let end = prev[1] && prev[1] + 1 || mat.length;
	    if (!Array.isArray(prev) && args.length === 1) {
	        result[prev].fill(value);
	    } else if (args.length === 1) {
	        for (let ind = start; ind < end; ind++) {
	            result[ind].fill(value);
	        }
	    }
	    for (let i = 1; i < args.length; i++) {
	        let first = Array.isArray(args[i]) ? args[i][0] || 0 : args[i];
	        let last = Array.isArray(args[i]) ? args[i][1] && args[i][1] + 1 || mat[0].length : args[i] + 1;
	        if (!Array.isArray(prev)) {
	            result[prev].fill(value, first, last);
	        } else {
	            for (let ind = start; ind < end; ind++) {
	                result[ind].fill(value, first, last);
	            }
	        }
	    }
	    return result;
	}


	/**
	 * Operates on two matrices of the same size
	 *
	 * @param mat input matrix that initialized the function
	 * @param operand second matrix with which operation is performed
	 * @param operation function performing the desired operation
	 * @returns result of the operation
	 */
	function operate(mat, operand, operation) {
	    let result = [];
	    let op = operand();

	    for (let i = 0; i < mat.length; i++) {
	        let op1 = mat[i];
	        let op2 = op[i];
	        result.push(op1.map(function(elem, ind) {
	            return operation(elem, op2[ind]);
	        }));
	    }

	    return result;
	}


	/**
	 * Finds the product of two matrices
	 *
	 * @param mat input matrix that initialized the function
	 * @param operand second matrix with which operation is performed
	 * @returns the product of the two matrices
	 */
	function prod(mat, operand) {
	    let op1 = mat;
	    let op2 = operand();
	    let size1 = size(op1);
	    let size2 = size(op2);
	    let result = [];
	    if (size1[1] === size2[0]) {
	        for (let i = 0; i < size1[0]; i++) {
	            result[i] = [];
	            for (let j = 0; j < size2[1]; j++) {
	                for (let k = 0; k < size1[1]; k++) {
	                    if (result[i][j] === undefined) {
	                        result[i][j] = 0;
	                    }
	                    result[i][j] += multiplication(op1[i][k], op2[k][j]);
	                }
	            }
	        }
	    }
	    return result;
	}


	/**
	 * Returns the transpose of a matrix, swaps rows with columns
	 *
	 * @param mat input matrix that initialized the function
	 * @returns a matrix with rows and columns swapped from the original matrix
	 */
	function trans(mat) {
	    let input = mat;
	    let s = size(mat);
	    let output = [];
	    for (let i = 0; i < s[0]; i++) {
	        for (let j = 0; j < s[1]; j++) {
	            if (Array.isArray(output[j])) {
	                output[j].push(input[i][j]);
	            } else {
	                output[j] = [input[i][j]];
	            }
	        }
	    }
	    return output;
	}

	/**
	 * Private method to clone the matrix
	 *
	 * @param mat input matrix that initialized the function
	 * @returns cloned matrix
	 */
	function clone(mat) {
	    let result = [];
	    for (let i = 0; i < mat.length; i++) {
	        result.push(mat[i].slice(0));
	    }
	    return result;
	}

	/**
	 * Performs addition
	 *
	 * @param op1 first operand
	 * @param op2 second operand
	 * @returns result
	 */
	function addition(op1, op2) {
	    return op1 + op2;
	}

	/**
	 * Performs subtraction
	 *
	 * @param op1 first operand
	 * @param op2 second operand
	 * @returns result
	 */
	function subtraction(op1, op2) {
	    return op1 - op2;
	}

	/**
	 * Performs multiplication
	 *
	 * @param op1 first operand
	 * @param op2 second operand
	 * @returns result
	 */
	function multiplication(op1, op2) {
	    return op1 * op2;
	}

	/**
	 * Performs division
	 *
	 * @param op1 first operand
	 * @param op2 second operand
	 * @returns result
	 */
	function division(op1, op2) {
	    return op1/op2;
	}


	/**
	 * Computes the determinant using row reduced echelon form
	 * Works best if the elements are integers or rational numbers
	 * The matrix must be a square
	 *
	 * @param mat input matrix that initialized the function
	 * @returns determinant value as a number
	 */
	function determinant(mat) {
	    let rationalized = rationalize(mat);
	    let siz = size(mat);
	    let det = rational_1(1);
	    let sign = 1;

	    for (let i = 0; i < siz[0] - 1; i++) {
	        for (let j = i + 1; j < siz[0]; j++) {
	            if (rationalized[j][i].num === 0) {
	                continue;
	            }
	            if (rationalized[i][i].num === 0) {
	                interchange(rationalized, i, j);
	                sign = -sign;
	                continue;
	            }
	            let temp = rationalized[j][i].div(rationalized[i][i]);
	            temp = rational_1(Math.abs(temp.num), temp.den);
	            if (Math.sign(rationalized[j][i].num) === Math.sign(rationalized[i][i].num)) {
	                temp = rational_1(-temp.num, temp.den);
	            }
	            for (let k = 0; k < siz[1]; k++) {
	                 rationalized[j][k] = temp.mul(rationalized[i][k]).add(rationalized[j][k]);
	            }
	        }
	    }

	    det = rationalized.reduce((prev, curr, index) => prev.mul(curr[index]), rational_1(1));

	    return sign * det.num/det.den;
	}

	/**
	 * Interchanges one row index with another on passed matrix
	 *
	 * @param mat input matrix
	 * @param ind1 one of the row indices to exchange
	 * @param ind2 one of the row indices to exchange
	 */
	function interchange(mat, ind1, ind2) {
	    let temp = mat[ind1];
	    mat[ind1] = mat[ind2];
	    mat[ind2] = temp;
	}

	/**
	 * Inverts the input square matrix using row reduction technique
	 * Works best if the elements are integers or rational numbers
	 * The matrix has to be a square and non-singular
	 *
	 * @param mat input matrix
	 * @returns inverse of the input matrix
	 */
	function invert(mat) {
	    let rationalized = rationalize(mat);
	    let siz = size(mat);
	    let result = rationalize(identity(siz[0]));

	    // Row Reduction
	    for (let i = 0; i < siz[0] - 1; i++) {
	        if (rationalized[i][i].num === 0) {
	            interchange(rationalized, i, i + 1);
	            interchange(result, i, i + 1);
	        }
	        if (rationalized[i][i].num !== 1 || rationalized[i][i] !== 1) {
	            let factor = rational_1(rationalized[i][i].num, rationalized[i][i].den);
	            for (let col = 0; col < siz[1]; col++) {
	                rationalized[i][col] = rationalized[i][col].div(factor);
	                result[i][col] = result[i][col].div(factor);
	            }
	        }
	        for (let j = i + 1; j < siz[0]; j++) {
	            if (rationalized[j][i].num === 0) {
	                // skip as no row elimination is needed
	                continue;
	            }

	            let temp = rational_1(-rationalized[j][i].num, rationalized[j][i].den);
	            for (let k = 0; k < siz[1]; k++) {
	                rationalized[j][k] = temp.mul(rationalized[i][k]).add(rationalized[j][k]);
	                result[j][k] = temp.mul(result[i][k]).add(result[j][k]);
	            }
	        }
	    }

	    // Further reduction to convert rationalized to identity
	    let last = siz[0] - 1;
	    if (rationalized[last][last].num !== 1 || rationalized[last][last] !== 1) {
	        let factor = rational_1(rationalized[last][last].num, rationalized[last][last].den);
	        for (let col = 0; col < siz[1]; col++) {
	            rationalized[last][col] = rationalized[last][col].div(factor);
	            result[last][col] = result[last][col].div(factor);
	        }
	    }

	    for (let i = siz[0] - 1; i > 0; i--) {
	        for (let j = i - 1; j >= 0; j--) {
	            let temp = rational_1(-rationalized[j][i].num, rationalized[j][i].den);
	            for (let k = 0; k < siz[1]; k++) {
	                rationalized[j][k] = temp.mul(rationalized[i][k]).add(rationalized[j][k]);
	                result[j][k] = temp.mul(result[i][k]).add(result[j][k]);
	            }
	        }
	    }

	    return derationalize(result);
	}

	/**
	 * Applies a given function over the matrix, elementwise. Similar to Array.map()
	 * The supplied function is provided 4 arguments:
	 * the current element,
	 * the row index,
	 * the col index,
	 * the matrix.
	 *
	 * @param mat input matrix
	 * @returns matrix of same dimensions with values altered by the function.
	 */
	function map(mat, func) {
	    const s = size(mat);
	    const result = [];
	    for (let i = 0; i < s[0]; i++) {
	        if(Array.isArray(mat[i])) {
	            result[i] = [];
	            for (let j = 0; j < s[1]; j++) {
	                result[i][j] = func(mat[i][j], i, j, mat);
	            }
	        } else {
	            result[i] = func(mat[i], i, 0, mat);
	        }
	    }
	    return result;
	}

	/**
	 * Converts a matrix of numbers to all rational type objects
	 *
	 * @param mat input matrix
	 * @returns matrix with elements of type rational
	 */
	function rationalize(mat) {
	    let rationalized = [];
	    mat.forEach((row, ind) => {
	        rationalized.push(row.map((ele) => rational_1(ele)));
	    });
	    return rationalized;
	}

	/**
	 * Converts a rationalized matrix to all numerical values
	 *
	 * @param mat input matrix
	 * @returns matrix with numerical values
	 */
	function derationalize(mat) {
	    let derationalized = [];
	    mat.forEach((row, ind) => {
	        derationalized.push(row.map((ele) => ele.num/ele.den));
	    });
	    return derationalized;
	}

	/**
	 * Generates a square matrix of specified size all elements with same specified value
	 *
	 * @param size specified size
	 * @param val specified value
	 * @returns square matrix
	 */
	function generate(size, val) {
	    let dim = 2;
	    while (dim > 0) {
	        var arr = [];
	        for (var i = 0; i < size; i++) {
	            if (Array.isArray(val)) {
	                arr.push(Object.assign([], val));
	            } else {
	                arr.push(val);
	            }
	        }
	        val = arr;
	        dim -= 1;
	    }
	    return val;
	}

	/**
	 * Generates an identity matrix of the specified size
	 *
	 * @param size specified size
	 * @returns identity matrix
	 */
	function identity(size) {
	    let result = generate(size, 0);
	    result.forEach((row, index) => {
	        row[index] = 1;
	    });
	    return result;
	}

	function matInterchange (inMat, ind1, ind2) {
	  const rez = new Array(inMat);
	  const temp = rez[ind1];
	  rez[ind1] = rez[ind2];
	  rez[ind2] = temp;
	  return inMat
	}
	function matSize (m) {
	  const s = [];
	  let mat = m;
	  while (Array.isArray(mat)) {
	    s.push(mat.length)
	    // eslint-disable-next-line no-param-reassign
	    ;[mat] = mat;
	  }
	  return s
	}
	function matIdentity (size) {
	  const str = new Array(size);
	  str.fill(0);
	  const rez = new Array(size);
	  rez.fill(str);
	  return rez.map((el1, i1) => {
	    return el1.map((el2, i2) => {
	      if (i1 === i2) return 1
	      return el2
	    })
	  })
	}

	function matInv (inp) {
	  const mat = inp();
	  const siz = matSize(mat);
	  const result = matIdentity(siz[0]);
	  // Row Reduction
	  for (let i = 0; i < siz[0] - 1; i += 1) {
	    if (mat[i][i].num === 0) {
	      matInterchange(mat, i, i + 1);
	      matInterchange(result, i, i + 1);
	    }
	    if (mat[i][i] !== 1) {
	      const factor = mat[i][i];
	      for (let col = 0; col < siz[1]; col += 1) {
	        mat[i][col] /= factor;
	        result[i][col] /= factor;
	      }
	    }
	    for (let j = i + 1; j < siz[0]; j += 1) {
	      if (!(mat[j][i].num === 0)) {
	        const temp = -mat[j][i];
	        for (let k = 0; k < siz[1]; k += 1) {
	          mat[j][k] = temp * mat[i][k] + mat[j][k];
	          result[j][k] = temp * result[i][k] + result[j][k];
	        }
	      }
	    }
	  }
	  // Further reduction to convert mat to identity
	  const last = siz[0] - 1;
	  if (mat[last][last] !== 1) {
	    const factor = mat[last][last];
	    for (let col = 0; col < siz[1]; col += 1) {
	      mat[last][col] /= factor;
	      result[last][col] /= factor;
	    }
	  }
	  for (let i = siz[0] - 1; i > 0; i -= 1) {
	    for (let j = i - 1; j >= 0; j -= 1) {
	      const temp = -mat[j][i];
	      for (let k = 0; k < siz[1]; k += 1) {
	        mat[j][k] = temp * mat[i][k] + mat[j][k];
	        result[j][k] = temp * result[i][k] + result[j][k];
	      }
	    }
	  }
	  return lib(result)
	}

	class Circuit {
	  constructor (rIni, aIni, arrJ) {
	    this.A = lib(aIni);
	    this.Y = lib(
	      rIni.map((el, i, arr) => arr.map((el2, i2) => (i2 === i ? 1 / el : 0)))
	    );
	    this.Ay = lib(this.A.prod(this.Y));
	    this.Ayat = lib(this.Ay.prod(lib(this.A.trans())));
	    this.invAyat = matInv(this.Ayat);
	    this.arrJ = arrJ;
	  }

	  U0 (arri) {
	    this.J = this.arrJ.map((el, i) => el.map(e => e * arri[i]));
	    this.J = this.J.reduce((acc, el) => acc.map((e, i2) => e + el[i2]));
	    this.J = this.J.map(el => [el]);
	    this.J = lib(this.J);
	    this.minAj = lib(lib(this.A.map(el => -1 * el)).prod(this.J));
	    return lib(this.invAyat.prod(this.minAj))
	  }

	  U (arri) {
	    const rez = lib(lib(this.A.trans()).prod(this.U0(arri)));
	    return rez
	  }

	  E (arri) {
	    let rez = this.U(arri)();
	    rez = rez.reduce((acc, el, i) => {
	      return acc + el[0] ** 2 * this.Y(i, i)
	    }, 0);
	    return rez
	  }

	  Es (arri) {
	    const u0 = this.U0(arri)();
	    const n = (u0.length + 1) / 3;
	    return u0[0][0] * arri[0] + u0[2 * n][0] * arri[1]
	  }

	  I (arri) {
	    let rez = this.U(arri)();
	    rez = lib(rez.map((el, i) => el[0] * this.Y(i, i)));
	    return rez
	  }
	}

	function createGraph (n) {
	  const nodes = n * 3;
	  const branches = 5 * n - 3;
	  const row = new Array(branches);
	  row.fill(0);
	  let graph = new Array(nodes - 1);
	  graph.fill(row);
	  graph = graph.map((el, m) => {
	    return el.map((el2, i) => {
	      // Ток вытекает в узел справа
	      if (m <= n - 2 && i === m) return -1;
	      if (m >= n && m <= 2 * n - 2 && i === m + n - 1) return -1;
	      if (m >= 2 * n && m <= 3 * n - 2 && i === m + 2 * n - 2) return -1;
	      // Ток втекает из узла слева
	      if (m >= 1 && m <= n - 1 && i === m - 1) return 1;
	      if (m >= n + 1 && m <= 2 * n - 1 && i === m + n - 2) return 1;
	      if (m >= 2 * n + 1 && m <= 3 * n - 1 && i === m + 2 * n - 3) return 1;
	      // Ток вытекает в узел снизу
	      if (m >= 0 && m <= n - 1 && i === m + n - 1) return -1;
	      if (m >= n && m <= 2 * n - 1 && i === m + 2 * n - 2) return -1;
	      // Ток втекает из узла сверху
	      if (m >= n && m <= 2 * n - 1 && i === m - 1) return 1;
	      if (m >= 2 * n && m <= 3 * n - 1 && i === m + n - 2) return 1;
	      return 0;
	    });
	  });
	  return graph;
	}

	function createR (wb, wt, clampV, clampH, cont, n) {
	  const cb = cont / 2;
	  const ct = cont / 2;
	  const branches = 5 * n - 3;
	  let R = new Array(branches);
	  R.fill(0);
	  R = R.map((el, i) => {
	    if (i <= n - 2) return wt / (n - 1);
	    if (i <= 2 * n - 1) return ct * n + (clampV * n) / 2;
	    if (i <= 3 * n - 3) return clampH / (n - 1);
	    if (i <= 4 * n - 3) return cb * n + (clampV * n) / 2;
	    if (i <= 5 * n - 4) return wb / (n - 1);
	    return 0;
	  });
	  return R;
	}

	function createICJ (n) {
	  const branches = 5 * n - 3;
	  let row = new Array(branches);
	  row.fill(0);
	  row = row.map((el, i) => {
	    if (i === n - 1) return 1;
	    if (i === 3 * n - 2) return 1;
	    if (i >= 4 * n - 2) return 1;
	    return 0;
	  });
	  return row;
	}
	function createILJ (n) {
	  const branches = 5 * n - 3;
	  let row = new Array(branches);
	  row.fill(0);
	  row = row.map((el, i) => {
	    if (i >= 4 * n - 2) return 1;
	    return 0;
	  });
	  return row;
	}

	function createCircuit (obj) {
	  const n = parseInt(obj.n.value, 10);
	  const a = createGraph(n);
	  const iCJ = createICJ(n);
	  const iLJ = createILJ(n);
	  const argArr = [obj.Rwb, obj.Rwt, obj.Rv, obj.Rh, obj.Rc, obj.n].map(el =>
	    el.units === 'мкОм' ? el.value * 1e-6 : el.value * 1
	  );
	  const R = createR(...argArr);
	  return new Circuit(R, a, [iCJ, iLJ]);
	}

	function initClampDE (t, iC, iL, hConv, c, obj) {
	  const delta = 5.670367e-8; // Постоянная Стефана — Больцмана
	  const alpha = obj.alpha.value; // Температурная постоянная сопротивления
	  const Tref = obj.Tref.units === 'K' ? obj.Tref.value : obj.Tref.value + 273.15;
	  const Fz = obj.Fc.value; // Площадь внешней поверхности зажима
	  const Tair = t;
	  const epsilon = obj.epsilon.value; // Коэффициент черноты поверхности
	  return function DE (x, y1 = [0]) {
	    const [y] = y1;
	    const E = c.Es([iC(x), iL(x)]) * (1 + alpha * (Tair + y - Tref));
	    const Qconv = hConv(y + Tair) * Fz * y;
	    const Qrad = epsilon * Fz * delta * ((y + Tair) ** 4 - Tair ** 4);
	    const Qtot = Qconv + Qrad;
	    const rez = (E - Qtot) / 255.62151205326109;
	    return [rez]
	  }
	}

	function createI (load) {
	  let arr = load.values
	    .filter(el => el.t || el.i)
	    .map(el => {
	      return { t: parseFloat(el.t), i: parseFloat(el.i) };
	    });
	  if (load.option === 'const')
	    return function iConst () {
	      return arr[0].i;
	    };
	  arr = arr.reverse();
	  if (load.option === 'step')
	    return function iStep (t) {
	      if (t >= arr[0].t) return arr[0].i;
	      return arr.find(el => el.t <= t).i;
	    };

	  if (load.option === 'linear')
	    return function iLinear (t) {
	      if (t >= arr[0].t) return arr[0].i;
	      const ind = arr.findIndex(el => el.t <= t);
	      const i0 = arr[ind].i;
	      const i1 = arr[ind - 1].i;
	      const t0 = arr[ind].t;
	      const t1 = arr[ind - 1].t;
	      const i = i0 + ((t - t0) * (i1 - i0)) / (t1 - t0);
	      return i;
	    };
	  return null;
	}
	function parseValues (obj) {
	  return Object.entries(obj).reduce((acc, el) => {
	    acc[el[0]] = { ...el[1], value: parseFloat(el[1].value) };
	    return acc;
	  }, {});
	}
	let x0 = 0;
	let y0 = 0;
	function runSolver (fn, solver, solTask, callback) {
	  const a = solver.solve(
	    fn,
	    x0,
	    y0,
	    solTask.t,
	    solver.grid(solTask.step, function collectResult (x1, y) {
	      callback(null, null, x1, y);
	    })
	  );
	  x0 = a.xEnd;
	  y0 = a.y;
	}
	function solveDE ({ thermal, resistance, task, loads, solver }) {
	  thermal = parseValues(thermal);
	  solver.values = solver.values
	    .map(el => {
	      return { t: parseFloat(el.t), step: parseFloat(el.step) };
	    })
	    .filter(el => el.t && el.step);
	  const alpha = thermal.alpha.value;
	  const Tair =
	    thermal.Tair.unit === 'К'
	      ? thermal.Tair.value
	      : thermal.Tair.value + 273.15;
	  const Tref = thermal.Tref.value;
	  const results = [];
	  const iL = createI(loads[0]);
	  const iC = createI(loads[1]);
	  const hConv = convectionObj(thermal);
	  const c = createCircuit(resistance);
	  const f = initClampDE(Tair, iC, iL, hConv, c, thermal);
	  results[0] = { task, result: [] };
	  function collectValues (n, x0, x1, y) {
	    const collect = [
	      x1,
	      y[0],
	      c.Es([iC(x1), iL(x1)]) * (1 + alpha * (Tair + y[0] - Tref)),
	      iC(x1),
	      iL(x1),
	    ];
	    postMessage({ task, result: collect });

	    if (results[0].result.length === 0) {
	      results[0].result[0] = collect;
	    } else if (
	      results[0].result[results[0].result.length - 1][0] !== collect[0]
	    ) {
	      results[0].result = [...results[0].result, collect];
	    }
	  }
	  const start = new Date();
	  const s = new odex$1.Solver(1);
	  s.absoluteTolerance = 1e-12;
	  s.relativeTolerance = 1e-12;
	  s.denseOutput = true;
	  solver.values.forEach(el => {
	    runSolver(f, s, el, collectValues);
	  });
	  const end = new Date();
	  console.log('Время расчета:', end - start);
	  postMessage({ results: results[0], isDone: true });
	}
	onmessage = function onMessage (e) {
	  solveDE(e.data);
	};

}());
//# sourceMappingURL=worker.js.map
