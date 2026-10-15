// Me's Stack. Workspace lives only here; shares event/[id], organizer/[id]
// with Explore and Saved, and the create fork + published with Explore.
//
// The Me TAB's href depends on FILE ORDER, not on the anchor below. The tab bar
// builds it from the group with no nested state (react-navigation/native/
// useLinkBuilder.js:53-96), and that path falls back to `index`, else the
// group's FIRST screen (fork/getPathFromState.js:153-185) — initialRouteName
// is never read. A group's screens are its direct files in require.context
// key order (getRoutesCore.js:481-494). The shared folder is therefore named
// (me,explore), not (explore,me): ')' sorts before ',', so (me)/me.tsx comes
// first and the tab reads /me. Under (explore,me) it read /create
// (measured 2026-10-15). Any new file directly in (me)/ that sorts before
// me.tsx would break the href the same way.
import TabStack from '../../../components/TabStack';

export const unstable_settings = { anchor: 'me' };

export default TabStack;
