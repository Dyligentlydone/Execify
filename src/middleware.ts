import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    const { userId, orgId } = await auth();

    // 1. If not a public route, protect it
    if (!isPublicRoute(req)) {
        await auth.protect();
    }

    // 2. If authenticated, not on a public/onboarding route, and no orgId selected -> redirect to onboarding
    if (
        userId &&
        !isPublicRoute(req) &&
        !isOnboardingRoute(req) &&
        !orgId
    ) {
        const onboardingUrl = new URL("/onboarding", req.url);
        return Response.redirect(onboardingUrl);
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and static files
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
