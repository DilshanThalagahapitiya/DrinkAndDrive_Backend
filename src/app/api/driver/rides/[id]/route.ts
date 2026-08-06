// ============================================================
// PATCH /api/driver/rides/[id] - Driver Ticket Actions + Ride Workflow
// ============================================================
// ACCEPT / CANCEL — accept or cancel an ASSIGNED ticket
// START      — requires odo start reading + proof photo
// WAITING    — start waiting timer (works without odo)
// CONTINUE   — stop waiting timer, record interval
// COMPLETE   — requires odo end reading (photo optional)
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authenticateRequest } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return errorResponse("Unauthorized. Please login first.", 401);
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const action = body.action as string;
    const now = new Date();

    // ---- Fetch ride once ----
    const ride = await prisma.ride.findUnique({ where: { id } });
    if (!ride) return errorResponse("Ride not found", 404);

    // Only the assigned driver can act
    if (ride.driverId !== authUser.userId) {
      return errorResponse("This ride is not assigned to you.", 403);
    }

    // Editable fields from driver form (incl. odo readings)
    const {
      pickupLocation, dropLocation, specialNote, customerName, customerNumber,
      pickupLatitude, pickupLongitude, dropLatitude, dropLongitude,
      odoStart, odoEnd, odoStartImage, odoEndImage,
    } = body;
    const editableData = {
      ...(pickupLocation !== undefined ? { pickupLocation } : {}),
      ...(dropLocation !== undefined ? { dropLocation } : {}),
      ...(pickupLatitude !== undefined ? { pickupLatitude: Number(pickupLatitude) } : {}),
      ...(pickupLongitude !== undefined ? { pickupLongitude: Number(pickupLongitude) } : {}),
      ...(dropLatitude !== undefined ? { dropLatitude: Number(dropLatitude) } : {}),
      ...(dropLongitude !== undefined ? { dropLongitude: Number(dropLongitude) } : {}),
      ...(odoStart !== undefined ? { odoStart: Number(odoStart) } : {}),
      ...(odoEnd !== undefined ? { odoEnd: Number(odoEnd) } : {}),
      ...(odoStartImage !== undefined ? { odoStartImage: String(odoStartImage) } : {}),
      ...(odoEndImage !== undefined ? { odoEndImage: String(odoEndImage) } : {}),
      ...(specialNote !== undefined ? { specialNote } : {}),
      ...(customerName !== undefined ? { customerName } : {}),
      ...(customerNumber !== undefined ? { customerNumber } : {}),
    };

    const includeRide = {
      include: {
        driver: { select: { id: true, fullName: true, phone: true } },
        rider: { select: { id: true, fullName: true, phone: true } },
      },
    };

    // ---- ACCEPT ----
    if (action === "ACCEPT") {
      if (ride.status !== "ASSIGNED") {
        return errorResponse("Ticket can only be accepted when it is ASSIGNED.", 400);
      }
      const updated = await prisma.ride.update({
        where: { id },
        data: {
          driverAccepted: true,
          driverCancelled: false,
          ...(ride.riderAccepted ? { status: "UPCOMING", startedAt: null } : {}),
        },
        ...includeRide,
      });
      return successResponse(
        { ride: updated },
        ride.riderAccepted
          ? "Both accepted! The ride is now scheduled (UPCOMING)."
          : "Ticket accepted! Waiting for the rider to accept too."
      );
    }

    // ---- CANCEL ----
    if (action === "CANCEL") {
      const updated = await prisma.ride.update({
        where: { id },
        data: {
          status: "PENDING_REQUEST",
          driverAccepted: null,
          riderAccepted: null,
          driverCancelled: true,
          riderCancelled: null,
          startedAt: null,
        },
        ...includeRide,
      });
      return successResponse({ ride: updated }, "Ticket cancelled. The ride will be re-assigned.");
    }

    // ---- START: odo reading required, photo optional ----
    if (action === "START") {
      if (!body.odoStart) {
        return errorResponse("Odometer start reading is REQUIRED before starting the ride.", 400);
      }
      // odoStartImage is OPTIONAL (proof photo; not required)

      // If the driver was waiting BEFORE pressing Start, record that interval
      // (it counts toward waiting billing even though the ride officially starts now).
      let preStartData: Record<string, unknown> = { waitingSince: null };
      if (ride.waitingSince) {
        const seconds = Math.floor((now.getTime() - ride.waitingSince.getTime()) / 1000);
        if (seconds > 0) {
          let intervals: any[] = [];
          try { intervals = ride.waitingIntervals ? JSON.parse(ride.waitingIntervals) : []; } catch {}
          intervals.push({
            start: ride.waitingSince.toISOString(),
            end: now.toISOString(),
            seconds,
          });
          preStartData = {
            waitingSince: null,
            waitingTotal: { increment: seconds },
            waitingIntervals: JSON.stringify(intervals),
          };
        }
      }

      const updated = await prisma.ride.update({
        where: { id },
        data: {
          status: "ONGOING",
          startedAt: now,
          rideStartedAt: now,
          odoStart: Number(body.odoStart),
          ...(body.odoStartImage != null && body.odoStartImage !== undefined
            ? { odoStartImage: String(body.odoStartImage) }
            : {}),
          ...preStartData,
          ...editableData,
        },
        ...includeRide,
      });
      return successResponse({ ride: updated }, "Ride started! Pre-start waiting time saved too.");
    }

    // ---- WAITING: allowed WITHOUT odo (not a ride start) ----
    // KEEP the current status (UPCOMING/ASSIGNED/ONGOING) — do NOT move
    // the ride to ONGOING before the driver has actually pressed Start Ride.
    // This way the driver app still shows "Start Ride" until START is pressed.
    if (action === "WAITING") {
      if (ride.status !== "ONGOING" && ride.status !== "UPCOMING" && ride.status !== "ASSIGNED") {
        return errorResponse("Cannot start waiting for this ride status.", 400);
      }
      const updated = await prisma.ride.update({
        where: { id },
        data: { waitingSince: now },
        ...includeRide,
      });
      return successResponse({ ride: updated }, "Waiting timer started!");
    }

    // ---- CONTINUE ----
    if (action === "CONTINUE") {
      if (!ride.waitingSince) {
        return errorResponse("No waiting timer is active.", 400);
      }
      const seconds = Math.floor((now.getTime() - ride.waitingSince.getTime()) / 1000);
      const interval = {
        start: ride.waitingSince.toISOString(),
        end: now.toISOString(),
        seconds,
      };
      let intervals: any[] = [];
      try { intervals = ride.waitingIntervals ? JSON.parse(ride.waitingIntervals) : []; } catch {}
      intervals.push(interval);

      const updated = await prisma.ride.update({
        where: { id },
        data: {
          waitingSince: null,
          waitingTotal: { increment: seconds },
          waitingIntervals: JSON.stringify(intervals),
          ...editableData,
        },
        ...includeRide,
      });
      return successResponse(
        { ride: updated },
        `Waiting stopped! Total waiting: ${updated.waitingTotal}s. You can continue riding.`
      );
    }

    // ---- SAVE: persists edited fields (odo, locations) without changing status ----
    if (action === "SAVE") {
      const updated = await prisma.ride.update({
        where: { id },
        data: {
          ...editableData,
          // If waiting timer is active, keep it going
          ...(ride.waitingSince ? { waitingSince: ride.waitingSince } : {}),
        },
        include: {
          driver: { select: { id: true, fullName: true, phone: true } },
          rider: { select: { id: true, fullName: true, phone: true } },
        },
      });
      return successResponse({ ride: updated }, "Saved! Updated on portal.");
    }

    // ---- COMPLETE: odo end required + FARE CALCULATION ----
    if (action === "COMPLETE") {
      if (!body.odoEnd) {
        return errorResponse("Odometer end reading is REQUIRED before completing the ride.", 400);
      }

      // Fetch the current Rate Table for fare calculation
      const rate = await prisma.rateTable.findFirst();
      const distanceKm = Math.max(0, (Number(body.odoEnd) || 0) - (ride.odoStart || 0));
      const waitingSec = ride.waitingTotal || 0;
      const waitingMin = Math.floor(waitingSec / 60);

      // KM-based pricing (tiered + max cap)
      const firstKm = Math.min(distanceKm, rate?.kmTierLimit || 10);
      const restKm = Math.max(0, distanceKm - (rate?.kmTierLimit || 10));
      const distanceCost = firstKm * (rate?.perKmRate || 50) + restKm * Math.min(rate?.kmTier2Rate || 60, rate?.kmMaxRate || 100);

      // Waiting pricing (free minutes then per-min rate)
      const freeMinutes = rate?.freeWaitingMin || 2;
      const chargedMinutes = Math.max(0, waitingMin - freeMinutes);
      const waitingCost = chargedMinutes * (rate?.waitingRatePerMin || 20);

      const baseFare = rate?.baseFare ?? 100;
      const totalFare = baseFare + distanceCost + waitingCost;

      const breakdown = {
        baseFare,
        distanceKm,
        distanceCost: Math.round(distanceCost),
        waitingMin,
        freeWaitingMin: freeMinutes,
        chargedWaitingMin: chargedMinutes,
        waitingCost: Math.round(waitingCost),
        totalFare: Math.round(totalFare),
      };

      const updated = await prisma.ride.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: now,
          waitingSince: null,
          odoEnd: Number(body.odoEnd),
          ...(body.odoEndImage !== undefined ? { odoEndImage: String(body.odoEndImage) } : {}),
          totalFare: Math.round(totalFare),
          fareBreakdown: JSON.stringify(breakdown),
          ...editableData,
        },
        ...includeRide,
      });
      return successResponse(
        { ride: updated },
        `Ride completed! Total fare: Rs. ${Math.round(totalFare)} (saved on portal).`
      );
    }

    return errorResponse("Invalid action. Use ACCEPT, CANCEL, START, WAITING, CONTINUE, COMPLETE.", 400);
  } catch (error) {
    console.error("Driver ride action error:", error);
    return errorResponse("Failed to process ride action.", 500);
  }
}