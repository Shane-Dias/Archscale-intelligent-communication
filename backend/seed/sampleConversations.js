// Sample conversations you can paste into the app for a quick demo
// (or POST directly to /api/extract) without waiting on live client data.

module.exports = [
  {
    source: "whatsapp",
    rawText: `Priya: Hey team, client just approved the revised floor plan for the 3rd floor.
Rahul: Great! I'll update the CAD drawings by Friday.
Priya: Also, we still need sign-off from the structural engineer on the beam changes — that's pending.
Amit: I'll follow up with the structural engineer tomorrow and get back by Wednesday.
Priya: Perfect. Also reminder — vendor quotes for flooring are due next Monday, can someone own that?
Rahul: I can chase the vendor quotes, will have them by Monday.`,
  },
  {
    source: "meeting_transcript",
    rawText: `Meeting: Weekly Site Sync — Sept 10
Attendees: Priya (PM), Rahul (Architect), Amit (Site Engineer)

Priya: Let's start with the budget review. We're 5% over on the electrical fittings, need to decide if we absorb it or renegotiate with the vendor.
Amit: I'd recommend renegotiating. I'll draft an email to the vendor by tomorrow.
Rahul: Also, the client wants an additional balcony on Unit 4B — decision pending till the structural review.
Priya: Agreed, we'll hold approval on 4B until structural review is done, expected by next Thursday.
Amit: I'll also need someone to finalize the material list for the lobby by end of week.
Priya: Rahul, can you take that?
Rahul: Yes, I'll finalize the lobby material list by Friday.`,
  },
];
