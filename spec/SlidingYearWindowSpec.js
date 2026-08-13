/**
 * Dates carry a two digit year, so the century has to be guessed. Section 7.1.2
 * of the GS1 General Specifications puts a sliding window around the current
 * year: a year more than fifty ahead belongs to the century before, and one more
 * than forty nine behind to the century after, rather than the fixed "51 to 99 is
 * the twentieth century" rule upstream used.
 *
 * The window moves with the clock, so the year is worked out here rather than
 * hard coded. The far edges are reached by moving the clock instead, which is the
 * only way to see the century-ahead half at all: it needs a two digit year fifty
 * behind the current one, and that cannot be written in two digits until 2050.
 */
const { parseBarcode } = require("../src/BarcodeParser");

function expiryFor(twoDigitYear) {
    const asText = String(twoDigitYear).padStart(2, "0");

    return parseBarcode(`]C117${asText}0601`).parsedCodeItems[0].data;
}

describe("The sliding window, as the clock stands today", () => {
    const currentYear = new Date().getUTCFullYear();
    const currentTwoDigits = currentYear % 100;
    const currentCentury = currentYear - currentTwoDigits;

    it("reads the current year as the current century", () => {
        expect(expiryFor(currentTwoDigits).getFullYear()).toBe(currentYear);
    });

    it("reads a year just inside the window as this century", () => {
        const inside = currentTwoDigits + 50;

        if (inside > 99) {
            pending("a year fifty ahead cannot be written in two digits from here");
            return;
        }

        expect(expiryFor(inside).getFullYear()).toBe(currentCentury + inside);
    });

    it("reads a year just outside the window as the century before", () => {
        const outside = currentTwoDigits + 51;

        if (outside > 99) {
            pending("a year fifty one ahead cannot be written in two digits from here");
            return;
        }

        expect(expiryFor(outside).getFullYear()).toBe(currentCentury + outside - 100);
    });
});

describe("The sliding window, with the clock moved", () => {
    beforeEach(() => {
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it("puts a year fifty behind into the century ahead", () => {
        jasmine.clock().mockDate(new Date(2060, 5, 1));

        // 2060, so "10" is fifty behind and reads as 2110 rather than 2010.
        expect(expiryFor(10).getFullYear()).toBe(2110);
    });

    it("keeps a year forty nine behind in the current century", () => {
        jasmine.clock().mockDate(new Date(2060, 5, 1));

        expect(expiryFor(11).getFullYear()).toBe(2011);
    });

    it("still puts a year fifty one ahead into the century before", () => {
        // Both edges cannot be written in two digits from the same year, so this
        // one is taken from 2005, where fifty one ahead is 56.
        jasmine.clock().mockDate(new Date(2005, 5, 1));

        expect(expiryFor(56).getFullYear()).toBe(1956);
    });

    it("moves the whole window rather than cutting at a fixed year", () => {
        jasmine.clock().mockDate(new Date(2005, 5, 1));

        // Upstream's fixed rule read anything above 50 as 19xx. In 2005 the
        // window reaches to 2055, so 55 is ahead of us, not half a century back.
        expect(expiryFor(55).getFullYear()).toBe(2055);
    });
});
