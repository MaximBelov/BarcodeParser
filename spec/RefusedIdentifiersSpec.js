/**
 * Every way the parser can refuse an application identifier.
 *
 * The big switch throws a two digit code which a switch at the very bottom turns
 * into a message, and until now nothing exercised either side of that. The codes
 * are an internal detail, so these specs pin the messages a caller actually sees.
 *
 * Several of these are reached only by a barcode which stops in the middle of an
 * AI, where the digit the switch is about to read is not there at all. That is a
 * real scan of a damaged or half-read code, and it used to fall through to a
 * message naming a different AI than the one in the data.
 */
const { parseBarcode } = require("../src/BarcodeParser");

const refusals = [
    { barcode: "]C10"    , message: "invalid AI after '0'" },
    { barcode: "]C11"    , message: "invalid AI after '1'" },
    { barcode: "]C12"    , message: "invalid AI after '2'" },
    { barcode: "]C124"   , message: "invalid AI after '24'" },
    { barcode: "]C125"   , message: "invalid AI after '25'" },
    { barcode: "]C13"    , message: "invalid AI after '3'" },
    { barcode: "]C131"   , message: "invalid AI after '31'" },
    { barcode: "]C132"   , message: "invalid AI after '32'" },
    { barcode: "]C133"   , message: "invalid AI after '33'" },
    { barcode: "]C134"   , message: "invalid AI after '34'" },
    { barcode: "]C135"   , message: "invalid AI after '35'" },
    { barcode: "]C136"   , message: "invalid AI after '36'" },
    { barcode: "]C139"   , message: "invalid AI after '39'" },
    { barcode: "]C14"    , message: "invalid AI after '4'" },
    { barcode: "]C140"   , message: "invalid AI after '40'" },
    { barcode: "]C141"   , message: "invalid AI after '41'" },
    { barcode: "]C142"   , message: "invalid AI after '42'" },
    { barcode: "]C17"    , message: "invalid AI after '7'" },
    { barcode: "]C170"   , message: "invalid AI after '70'" },
    { barcode: "]C1700"  , message: "invalid AI after '700'" },
    { barcode: "]C171"   , message: "invalid AI after '71'" },
    { barcode: "]C18"    , message: "invalid AI after '8'" },
    { barcode: "]C180"   , message: "invalid AI after '80'" },
    { barcode: "]C1800"  , message: "invalid AI after '800'" },
    { barcode: "]C1801"  , message: "invalid AI after '801'" },
    { barcode: "]C1802"  , message: "invalid AI after '802'" },
    { barcode: "]C181"   , message: "invalid AI after '81'" },
    { barcode: "]C1810"  , message: "invalid AI after '810'" },
    { barcode: "]C1811"  , message: "invalid AI after '811'" },
    { barcode: "]C182"   , message: "invalid AI after '82'" },
    { barcode: "]C19"    , message: "invalid AI after '9'" },
    { barcode: "]C15"    , message: "no valid AI" },
];

describe("An application identifier the parser does not know", () => {
    refusals.forEach((refusal) => {
        it(`is refused with "${refusal.message}"`, () => {
            expect(() => parseBarcode(refusal.barcode)).toThrow(refusal.message);
        });
    });
});

/**
 * Two different defaults throw the same internal code, so this one reports the
 * AI before it. The message is wrong, and this spec says so rather than leaving
 * the path unexercised: correcting the message should fail here and be updated
 * on purpose.
 */
describe("An unknown identifier below 43", () => {
    it("is refused, though the message names 42 rather than 43", () => {
        expect(() => parseBarcode("]C143")).toThrow("invalid AI after '42'");
    });
});
