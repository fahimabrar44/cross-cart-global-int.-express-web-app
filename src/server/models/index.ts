// Register every mongoose model so populate/ref paths work in any serverless
// function, regardless of which route was hit first (avoids
// "Schema hasn't been registered for model ..." on cold starts).
import "./User.model";
import "./Rider.model";
import "./Track.model";
import "./Country.model";
import "./Coupon.model";
import "./Branch.model";
import "./ApiConfig.model";
import "./Settings.model";
import "./Order.model";
import "./Referral.model";
import "./FAQ.model";
import "./Review.model";
import "./Price.model";
import "./Pickup.model";
import "./Offer.model";
import "./Notification.model";
import "./LoginHistory.model";
import "./Contact.model";
import "./Blog.model";
import "./ApiAccessLog.model";
import "./Address.model";
