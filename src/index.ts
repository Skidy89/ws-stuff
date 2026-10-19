import SaucePan from "./account.js";


(async () => {
    const sauce = new SaucePan("Bearer ...")
    const auth = await sauce.isAuthValid();
    if (!auth) return new Error("Invalid authorization token");
    console.log("authenticated!");
    const character = await sauce.startCompanionChat("9c9b18c9-cdf7-4373-85b6-57687c84eb71");
    console.log("Character info:", character);
    
})();
