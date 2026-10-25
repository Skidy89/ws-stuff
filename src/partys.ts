import type Requester from "./requester.js";
import type { Session } from "./session.js";
// this is a headcache.

// current hypothesis:
/**
 * we call api/v1/parties with the payload to make a party
 * then api/v1/parties/by-chat/id/initial calls it...
 * then we just poll api/v1/parties/becf879e-2ca4-46c2-95fa-081ee4e23d0a/live-status???
 * im not sure if changes generation, calling it on a party makes live status enter into "pre_voting_generating"
 */

export default class SauceParties {
  constructor(
    private readonly http: Requester,
    private readonly session: Session,
  ) {}
}
